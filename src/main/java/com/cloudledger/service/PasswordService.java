package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.config.SecurityProperties;
import com.cloudledger.common.exception.BusinessException;
import com.cloudledger.common.jwt.JwtUtil;
import com.cloudledger.common.mail.MailService;
import com.cloudledger.common.security.PasswordPolicy;
import com.cloudledger.dto.ChangePasswordRequest;
import com.cloudledger.dto.ResetPasswordRequest;
import com.cloudledger.entity.User;
import com.cloudledger.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 密码安全模块业务逻辑
 * - 忘记密码：邮箱验证码发送 / 验证码校验 + 重置
 * - 登录态修改密码：原密码校验 + 当前 Token 拉黑 + 改密标记使全部旧 Token 失效
 * - 所有敏感操作以 [安全审计] 前缀记录日志；日志中禁止出现明文密码与验证码
 */
@Slf4j
@Service
public class PasswordService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private MailService mailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SecurityProperties securityProperties;

    /**
     * 发送密码重置验证码
     * 防账户枚举：邮箱不存在时返回与成功不可区分的响应（Controller 层统一文案），不发信、不写 Redis
     */
    public void sendResetCode(String email, String clientIp) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (user == null) {
            log.info("[安全审计] 操作=发送重置验证码 email={} ip={} 结果=USER_NOT_FOUND", email, clientIp);
            return;
        }

        if (cacheService.isResetCodeInCooldown(email)) {
            log.info("[安全审计] 操作=发送重置验证码 userId={} email={} ip={} 结果=RATE_LIMITED",
                    user.getUserId(), email, clientIp);
            throw new BusinessException(429, "验证码发送过于频繁，请稍后再试");
        }

        // 先写 Redis 再发信；发信失败立即回滚，避免残留无效验证码与冷却时间
        String code = cacheService.createEmailResetCode(email);
        try {
            mailService.sendPasswordResetCode(email, code);
        } catch (RuntimeException e) {
            cacheService.evictResetCodeKeys(email);
            throw e;
        }

        log.info("[安全审计] 操作=发送重置验证码 userId={} email={} ip={} 结果=SENT",
                user.getUserId(), email, clientIp);
    }

    /**
     * 验证码校验通过后重置密码
     */
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(ResetPasswordRequest request, String clientIp) {
        String email = request.getEmail();

        String cachedCode = cacheService.getEmailResetCode(email);
        if (cachedCode == null) {
            log.info("[安全审计] 操作=重置密码 email={} ip={} 结果=CODE_EXPIRED", email, clientIp);
            throw new BusinessException(400, "验证码已过期或不存在，请重新获取");
        }

        if (!cachedCode.equals(request.getCode())) {
            int attempts = cacheService.incrementResetCodeAttempts(email);
            if (attempts >= securityProperties.getResetCode().getMaxAttempts()) {
                cacheService.evictResetCodeKeys(email);
                log.warn("[安全审计] 操作=重置密码 email={} ip={} 结果=ATTEMPTS_EXHAUSTED", email, clientIp);
                throw new BusinessException(400, "验证码错误次数过多，请重新获取");
            }
            log.info("[安全审计] 操作=重置密码 email={} ip={} 结果=CODE_MISMATCH attempts={}",
                    email, clientIp, attempts);
            throw new BusinessException(400, "验证码错误");
        }

        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (user == null) {
            // 验证码存在但用户已不存在（极端并发场景），按过期处理，不暴露账户状态
            cacheService.evictResetCodeKeys(email);
            log.info("[安全审计] 操作=重置密码 email={} ip={} 结果=USER_NOT_FOUND", email, clientIp);
            throw new BusinessException(400, "验证码已过期或不存在，请重新获取");
        }

        // 以下输入类错误不消费验证码，用户可凭同一验证码修正后重新提交
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(400, "两次输入的密码不一致");
        }
        PasswordPolicy.validate(request.getNewPassword());
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BusinessException(400, "新密码不能与旧密码相同");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.updateById(user);

        // 清理验证码、失效全部既有会话与改密前签发的 Token
        cacheService.evictResetCodeKeys(email);
        cacheService.evictSession(user.getUserId());
        cacheService.markPasswordChanged(user.getUserId());

        log.info("[安全审计] 操作=重置密码 userId={} email={} ip={} 结果=SUCCESS",
                user.getUserId(), email, clientIp);
    }

    /**
     * 登录态修改密码
     *
     * @param userId  当前登录用户（取自 JWT，不可伪造）
     * @param token   当前请求 Bearer Token，成功后加入黑名单
     * @param clientIp 客户端 IP（审计用）
     */
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(String userId, ChangePasswordRequest request,
                               String token, String clientIp) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUserId, userId));
        if (user == null) {
            log.warn("[安全审计] 操作=修改密码 userId={} ip={} 结果=USER_NOT_FOUND", userId, clientIp);
            throw new BusinessException(401, "用户不存在，请重新登录");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            log.warn("[安全审计] 操作=修改密码 userId={} ip={} 结果=OLD_PASSWORD_MISMATCH",
                    userId, clientIp);
            throw new BusinessException(400, "原密码不正确");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(400, "两次输入的密码不一致");
        }
        PasswordPolicy.validate(request.getNewPassword());
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BusinessException(400, "新密码不能与旧密码相同");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.updateById(user);

        // 当前 Token 拉黑 + 会话清除 + 改密标记（拦截其他未过期 Token）
        if (StringUtils.hasText(token)) {
            cacheService.blacklistToken(token, jwtUtil.getRemainingTime(token));
        }
        cacheService.evictSession(userId);
        cacheService.markPasswordChanged(userId);

        log.info("[安全审计] 操作=修改密码 userId={} email={} ip={} 结果=SUCCESS",
                userId, user.getEmail(), clientIp);
    }
}

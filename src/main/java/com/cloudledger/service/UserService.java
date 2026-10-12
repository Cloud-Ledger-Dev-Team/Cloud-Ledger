package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.exception.BusinessException;
import com.cloudledger.common.jwt.JwtUtil;
import com.cloudledger.entity.Account;
import com.cloudledger.entity.User;
import com.cloudledger.mapper.AccountMapper;
import com.cloudledger.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;

/**
 * 用户模块业务逻辑
 * - 注册：bcrypt 哈希 + 默认账户创建（同一事务）
 * - 登录：bcrypt 校验 + 旧 SHA-256 平滑升级 + JWT 签发 + Redis 会话
 * - 登出：JWT 黑名单 + 会话删除
 */
@Slf4j
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AccountMapper accountMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CacheService cacheService;

    @Value("${cloud-ledger.wx.appid:}")
    private String wxAppId;

    @Value("${cloud-ledger.wx.secret:}")
    private String wxAppSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 用户注册：创建用户并生成「默认账户」（现金 / 余额 0）
     *
     * @return 新用户 user_id
     */
    @Transactional(rollbackFor = Exception.class)
    public String register(String name, String email, String password) {
        // 邮箱唯一性校验
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (count != null && count > 0) {
            throw new BusinessException(400, "该邮箱已被注册");
        }

        User user = new User();
        user.setUserId(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        userMapper.insert(user);

        // 创建默认账户
        Account account = new Account();
        account.setAccountId(UUID.randomUUID().toString());
        account.setUserId(user.getUserId());
        account.setName("默认账户");
        account.setType("现金");
        account.setBalance(BigDecimal.ZERO);
        accountMapper.insert(account);

        log.info("用户注册成功 userId={}, email={}", user.getUserId(), email);
        return user.getUserId();
    }

    /**
     * 用户登录
     * - bcrypt 直接校验
     * - 旧 SHA-256 哈希账号校验通过后自动升级为 bcrypt（平滑迁移）
     *
     * @return token 及用户信息
     */
    @Transactional(rollbackFor = Exception.class)
    public LoginResult login(String email, String password) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getEmail, email));
        if (user == null) {
            throw new BusinessException(401, "邮箱或密码错误");
        }

        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
            // bcrypt 校验
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new BusinessException(401, "邮箱或密码错误");
            }
        } else {
            // 旧版 SHA-256 兼容校验，通过后自动升级
            if (!sha256Hex(password).equals(user.getPassword())) {
                throw new BusinessException(401, "邮箱或密码错误");
            }
            user.setPassword(passwordEncoder.encode(password));
            userMapper.updateById(user);
            log.info("旧 SHA-256 密码已自动升级为 bcrypt, userId={}", user.getUserId());
        }

        // 签发 JWT
        String token = jwtUtil.generateToken(user.getUserId());

        // 写入 Redis 会话（30 min 滑动续期）
        cacheService.putSession(user.getUserId(), token);

        return new LoginResult(token, user);
    }

    /**
     * 微信登录
     * 流程：
     * 1. 接收小程序前端 wx.login() 返回的临时 code
     * 2. 调用微信 code2Session 接口换取 openid
     * 3. 按 openid 查找用户，不存在则自动注册
     * 4. 签发 JWT + 写入 Redis 会话
     *
     * @param code 微信临时登录凭证
     * @return token 及用户信息
     */
    @Transactional(rollbackFor = Exception.class)
    public LoginResult wxLogin(String code) {
        // 1. 调用微信 code2Session 接口
        String url = String.format(
                "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                wxAppId, wxAppSecret, code);

        ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = resp.getBody();

        if (body == null || body.get("openid") == null) {
            String errmsg = body != null ? String.valueOf(body.get("errmsg")) : "响应为空";
            int errcode = body != null && body.get("errcode") != null
                    ? Integer.parseInt(String.valueOf(body.get("errcode"))) : -1;
            log.error("微信 code2Session 失败 errcode={}, errmsg={}, code={}", errcode, errmsg, code);
            throw new BusinessException(401, "微信登录失败：" + errmsg);
        }

        String openid = String.valueOf(body.get("openid"));

        // 2. 按 openid 查找用户
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getOpenid, openid));

        if (user == null) {
            // 3. 自动注册新用户
            user = new User();
            user.setUserId(UUID.randomUUID().toString());
            user.setName("微信用户" + openid.substring(0, 8));
            user.setEmail(openid + "@wx.cloudledger.local");
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setOpenid(openid);
            userMapper.insert(user);

            // 创建默认账户
            Account account = new Account();
            account.setAccountId(UUID.randomUUID().toString());
            account.setUserId(user.getUserId());
            account.setName("默认账户");
            account.setType("现金");
            account.setBalance(BigDecimal.ZERO);
            accountMapper.insert(account);

            log.info("微信用户首次注册 userId={}, openid={}", user.getUserId(), openid);
        }

        // 4. 签发 JWT + 写入会话
        String token = jwtUtil.generateToken(user.getUserId());
        cacheService.putSession(user.getUserId(), token);

        return new LoginResult(token, user);
    }

    /**
     * 登出：Token 加入黑名单（TTL = 剩余有效期）+ 删除会话
     */
    public void logout(String token, String userId) {
        cacheService.blacklistToken(token, jwtUtil.getRemainingTime(token));
        cacheService.evictSession(userId);
    }

    /**
     * SHA-256 十六进制摘要（旧系统密码兼容用）
     */
    private String sha256Hex(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new BusinessException(500, "密码校验失败");
        }
    }

    /**
     * 登录结果封装
     */
    public record LoginResult(String token, User user) {
    }
}

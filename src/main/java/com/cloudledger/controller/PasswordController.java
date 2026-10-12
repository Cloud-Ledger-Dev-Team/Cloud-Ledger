package com.cloudledger.controller;

import com.cloudledger.common.config.SecurityProperties;
import com.cloudledger.common.response.Result;
import com.cloudledger.dto.ChangePasswordRequest;
import com.cloudledger.dto.ResetPasswordRequest;
import com.cloudledger.dto.SendResetCodeRequest;
import com.cloudledger.service.PasswordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 密码安全模块控制器
 * - 忘记密码：发送邮箱验证码 / 验证码重置密码（公开接口）
 * - 修改密码：强制 JWT 鉴权，成功后当前 Token 立即失效
 */
@Tag(name = "密码安全模块", description = "忘记密码、登录态修改密码")
@RestController
@RequestMapping("/api/password")
public class PasswordController {

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private SecurityProperties securityProperties;

    @Operation(summary = "发送密码重置验证码",
            description = "向注册邮箱发送 6 位数字验证码，有效期 5 分钟，同一邮箱 60 秒内仅可发送一次。"
                    + "出于账户枚举防护，邮箱未注册时响应与成功完全一致，但不会实际发信。需先在后台配置 SMTP。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "请求成功（不区分邮箱是否注册），data 含有效期与冷却秒数"),
            @ApiResponse(responseCode = "200", description = "发送过于频繁（code=429）或邮件服务不可用（code=503）",
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = "{\"code\":429,\"msg\":\"验证码发送过于频繁，请稍后再试\",\"data\":null}")))
    })
    @PostMapping("/forgot/code")
    public Result<Map<String, Object>> sendResetCode(@Valid @RequestBody SendResetCodeRequest request,
                                                     HttpServletRequest httpRequest) {
        String email = request.getEmail().trim();
        passwordService.sendResetCode(email, resolveClientIp(httpRequest));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("expire_seconds", securityProperties.getResetCode().getTtlSeconds());
        data.put("resend_cooldown", securityProperties.getResetCode().getResendCooldownSeconds());
        return Result.success("若该邮箱已注册，验证码将发送至邮箱", data);
    }

    @Operation(summary = "重置密码（忘记密码）",
            description = "凭邮箱验证码设置新密码。新密码要求 8-64 位且含字母和数字，不得与旧密码相同。"
                    + "验证码连续输错 5 次将作废；重置成功后该账户所有旧 Token 立即失效。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "重置成功"),
            @ApiResponse(responseCode = "200", description = "验证码错误/过期（code=400）、参数校验失败（code=400）")
    })
    @PostMapping("/forgot/reset")
    public Result<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                      HttpServletRequest httpRequest) {
        request.setEmail(request.getEmail().trim());
        passwordService.resetPassword(request, resolveClientIp(httpRequest));
        return Result.success("密码重置成功，请使用新密码登录", null);
    }

    @Operation(summary = "修改密码（登录态）",
            description = "需携带 Bearer Token。校验原密码后设置新密码；成功后当前 Token 加入黑名单、"
                    + "全部会话失效，前端须引导用户重新登录。")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "修改成功"),
            @ApiResponse(responseCode = "200", description = "未授权（code=401）、原密码不正确（code=400）")
    })
    @PostMapping("/change")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> changePassword(Authentication authentication,
                                       @Valid @RequestBody ChangePasswordRequest request,
                                       HttpServletRequest httpRequest) {
        String userId = (String) authentication.getPrincipal();
        passwordService.changePassword(userId, request,
                extractToken(httpRequest), resolveClientIp(httpRequest));
        return Result.success("密码修改成功，请重新登录", null);
    }

    /**
     * 解析客户端真实 IP：X-Forwarded-For 首跳 → X-Real-IP → remoteAddr
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}

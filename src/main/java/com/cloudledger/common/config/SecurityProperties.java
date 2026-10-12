package com.cloudledger.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 密码安全模块配置（对应 application.yml 的 cloud-ledger.security.*）
 * - 重置验证码：有效期 / 发送冷却 / 尝试上限
 * - 改密失效标记：TTL（与 JWT 最大有效期对齐）
 * - 发件人：地址与显示名称
 */
@Data
@Component
@ConfigurationProperties(prefix = "cloud-ledger.security")
public class SecurityProperties {

    /** 忘记密码邮件验证码策略 */
    private ResetCode resetCode = new ResetCode();

    /** 改密后旧 Token 失效标记策略 */
    private PasswordChange passwordChange = new PasswordChange();

    /** 发件人信息 */
    private Mail mail = new Mail();

    @Data
    public static class ResetCode {
        /** 验证码有效期（秒，默认 5 min） */
        private long ttlSeconds = 300;

        /** 同一邮箱两次发送的冷却时间（秒，默认 60 s） */
        private long resendCooldownSeconds = 60;

        /** 验证码连续输错上限，达到后验证码立即作废 */
        private int maxAttempts = 5;
    }

    @Data
    public static class PasswordChange {
        /** 改密时间标记 TTL（秒，默认 30 min，与 JWT 有效期一致） */
        private long markerTtlSeconds = 1800;
    }

    @Data
    public static class Mail {
        /** 发件人地址（为空时回退到 spring.mail.username） */
        private String from = "";

        /** 发件人显示名称 */
        private String fromName = "Cloud-Ledger 云记账";
    }
}

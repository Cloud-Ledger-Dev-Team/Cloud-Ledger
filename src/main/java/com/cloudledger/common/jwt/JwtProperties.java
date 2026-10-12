package com.cloudledger.common.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT 配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * 签名密钥（至少 32 字节）
     * 默认值仅为本地开发的明示占位符（非真实密钥），生产环境必须通过
     * jwt.secret / CLOUD_LEDGER_JWT_SECRET 环境变量注入强随机密钥
     */
    private String secret = "dev-only-insecure-default-secret-change-me!";

    /**
     * Token 有效期（毫秒），默认 30 分钟
     */
    private long expiration = 1800000;

    /**
     * 黑名单 Redis Key 前缀
     */
    private String blacklistPrefix = "cloud-ledger:jwt:blacklist:";
}

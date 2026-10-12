package com.cloudledger.common.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类（jjwt 0.12.x）
 * - 签发 Token
 * - 解析 Token
 * - 校验 Token
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 签发 JWT Token
     *
     * @param userId 用户唯一标识（user_id）
     * @param claims 额外声明（可选）
     * @return JWT 字符串
     */
    public String generateToken(String userId, Map<String, Object> claims) {
        Map<String, Object> allClaims = new HashMap<>();
        if (claims != null) {
            allClaims.putAll(claims);
        }
        allClaims.put("user_id", userId);

        long now = System.currentTimeMillis();
        long exp = now + jwtProperties.getExpiration();

        return Jwts.builder()
                .claims(allClaims)
                .subject(userId)
                .issuedAt(new Date(now))
                .expiration(new Date(exp))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * 签发 JWT Token（无额外声明）
     */
    public String generateToken(String userId) {
        return generateToken(userId, null);
    }

    /**
     * 解析 JWT Token（不校验过期）
     *
     * @param token JWT 字符串
     * @return Claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 校验 Token 是否有效（签名 + 过期）
     *
     * @param token JWT 字符串
     * @return true = 有效
     */
    public boolean validateToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 从 Token 中获取 user_id
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("user_id", String.class);
    }

    /**
     * 获取 Token 剩余有效期（毫秒）
     *
     * @return 剩余毫秒数，已过期返回 0
     */
    public long getRemainingTime(String token) {
        try {
            Claims claims = parseToken(token);
            long remaining = claims.getExpiration().getTime() - System.currentTimeMillis();
            return Math.max(remaining, 0);
        } catch (Exception e) {
            return 0;
        }
    }
}

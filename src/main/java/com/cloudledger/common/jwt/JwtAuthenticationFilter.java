package com.cloudledger.common.jwt;

import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.response.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 认证过滤器
 * - 从请求头提取 Authorization: Bearer <token>
 * - 校验 Token 签名 + 过期 + 黑名单
 * - 注入 SecurityContext
 */
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwtProperties jwtProperties;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CacheService cacheService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractToken(request);

            if (StringUtils.hasText(token)) {
                // 1. 校验 Token 是否在黑名单中
                if (cacheService.isTokenBlacklisted(token)) {
                    writeErrorResponse(response, 401, "Token 已失效");
                    return;
                }

                // 2. 校验 Token 有效性
                if (!jwtUtil.validateToken(token)) {
                    writeErrorResponse(response, 401, "Token 无效或已过期");
                    return;
                }

                // 3. 解析用户信息与签发时间
                Claims claims = jwtUtil.parseToken(token);
                String userId = claims.get("user_id", String.class);

                // 4. 改密标记校验：密码修改前签发的 Token 一律拒绝，强制重新登录
                if (claims.getIssuedAt() != null
                        && cacheService.isTokenBeforePasswordChange(
                                userId, claims.getIssuedAt().getTime())) {
                    writeErrorResponse(response, 401, "密码已修改，请重新登录");
                    return;
                }

                // 5. Redis 会话滑动续期（存在会话才续期）
                cacheService.touchSession(userId);

                // 6. 构建认证对象并注入 SecurityContext
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("JWT 认证失败: {}", e.getMessage(), e);
            writeErrorResponse(response, 500, "认证服务异常");
        }
    }

    /**
     * 从请求头提取 Bearer Token
     */
    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    /**
     * 写入错误响应（统一 Result 结构：code/msg/data）
     */
    private void writeErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(200);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Result.error(status, message)));
    }
}

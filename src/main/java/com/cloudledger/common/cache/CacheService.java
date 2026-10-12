package com.cloudledger.common.cache;

import com.cloudledger.common.config.CacheProperties;
import com.cloudledger.common.config.SecurityProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Redis 缓存统一服务
 * - 会话管理（写入 / 滑动续期 / 删除）
 * - JWT 黑名单
 * - 业务数据缓存（Cache Aside：读回填 / 写后删除）
 * - 缓存保护：空值防穿透、过期抖动防雪崩
 */
@Slf4j
@Service
public class CacheService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private CacheProperties cacheProperties;

    @Autowired
    private SecurityProperties securityProperties;

    @Autowired
    private ObjectMapper objectMapper;

    /** 空值占位（防缓存穿透） */
    public static final String EMPTY_VALUE = "";

    /** 空值缓存 TTL（秒，5 min） */
    private static final long EMPTY_TTL_SECONDS = 300;

    /** 验证码随机数生成器（SecureRandom 线程安全） */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ==================== 会话管理 ====================

    /**
     * 登录成功后写入会话
     */
    public void putSession(String userId, String token) {
        String key = cacheProperties.getSessionPrefix() + userId;
        stringRedisTemplate.opsForValue().set(key, token,
                Duration.ofSeconds(cacheProperties.getTtlSession()));
    }

    /**
     * 每次鉴权访问时滑动续期
     */
    public void touchSession(String userId) {
        String key = cacheProperties.getSessionPrefix() + userId;
        Boolean exists = stringRedisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(exists)) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(cacheProperties.getTtlSession()));
        }
    }

    /**
     * 登出时删除会话
     */
    public void evictSession(String userId) {
        stringRedisTemplate.delete(cacheProperties.getSessionPrefix() + userId);
    }

    // ==================== JWT 黑名单 ====================

    /**
     * 登出 / 改密时将 Token 加入黑名单，TTL 与 Token 剩余有效期一致
     */
    public void blacklistToken(String token, long remainingMillis) {
        if (remainingMillis <= 0) {
            return;
        }
        stringRedisTemplate.opsForValue()
                .set("cloud-ledger:jwt:blacklist:" + token, "1", Duration.ofMillis(remainingMillis));
    }

    /**
     * 校验 Token 是否在黑名单
     */
    public boolean isTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(
                stringRedisTemplate.hasKey("cloud-ledger:jwt:blacklist:" + token));
    }

    // ==================== 忘记密码验证码 ====================

    /**
     * 生成密码重置验证码并写入 Redis
     * - 验证码：6 位数字，TTL = reset-code.ttl-seconds
     * - 尝试计数：初始 0，TTL 与验证码一致
     * - 发送冷却：TTL = reset-code.resend-cooldown-seconds
     *
     * @return 6 位数字验证码明文（仅用于投递到用户邮箱，禁止记日志）
     */
    public String createEmailResetCode(String email) {
        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        long ttl = securityProperties.getResetCode().getTtlSeconds();
        long cooldown = securityProperties.getResetCode().getResendCooldownSeconds();

        stringRedisTemplate.opsForValue().set(resetCodeKey(email), code, Duration.ofSeconds(ttl));
        stringRedisTemplate.opsForValue().set(resetAttemptsKey(email), "0", Duration.ofSeconds(ttl));
        stringRedisTemplate.opsForValue().set(resetCooldownKey(email), "1", Duration.ofSeconds(cooldown));
        return code;
    }

    /**
     * 是否处于发送冷却期
     */
    public boolean isResetCodeInCooldown(String email) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(resetCooldownKey(email)));
    }

    /**
     * 读取当前有效验证码（不存在返回 null）
     */
    public String getEmailResetCode(String email) {
        return stringRedisTemplate.opsForValue().get(resetCodeKey(email));
    }

    /**
     * 尝试计数 +1 并返回最新值
     */
    public int incrementResetCodeAttempts(String email) {
        Long count = stringRedisTemplate.opsForValue().increment(resetAttemptsKey(email));
        return count == null ? 1 : count.intValue();
    }

    /**
     * 消费验证码：校验通过后删除验证码与尝试计数（冷却 Key 保留至自然过期）
     */
    public void consumeEmailResetCode(String email) {
        stringRedisTemplate.delete(resetCodeKey(email));
        stringRedisTemplate.delete(resetAttemptsKey(email));
    }

    /**
     * 清除该邮箱全部重置相关 Key（验证码 + 尝试计数 + 发送冷却）
     * - 尝试次数耗尽 / 发信失败回滚 / 重置成功后调用
     */
    public void evictResetCodeKeys(String email) {
        consumeEmailResetCode(email);
        stringRedisTemplate.delete(resetCooldownKey(email));
    }

    // ==================== 改密安全标记 ====================

    /**
     * 写入密码修改时间标记：使标记时间之前签发的 JWT 全部失效
     * TTL = password-change.marker-ttl-seconds（与 JWT 最大有效期对齐）
     */
    public void markPasswordChanged(String userId) {
        stringRedisTemplate.opsForValue().set(
                passwordChangeMarkerKey(userId),
                String.valueOf(System.currentTimeMillis()),
                Duration.ofSeconds(securityProperties.getPasswordChange().getMarkerTtlSeconds()));
    }

    /**
     * 判断 Token 签发时间是否早于最近一次改密时间
     *
     * @param issuedAtEpochMillis Token 的签发时间（epoch 毫秒）
     * @return true = Token 在改密前签发，应拒绝访问
     */
    public boolean isTokenBeforePasswordChange(String userId, long issuedAtEpochMillis) {
        String marker = stringRedisTemplate.opsForValue().get(passwordChangeMarkerKey(userId));
        if (marker == null) {
            return false;
        }
        try {
            // JWT iat 为秒级精度（毫秒部分恒为 0），改密标记为毫秒级。
            // 两边统一按秒级取整后比较，避免毫秒差导致的边界误判：
            // 改密前签发 → iat_seconds < marker_seconds → 拦截
            // 改密后签发 → iat_seconds >= marker_seconds → 放行
            // 同秒内（差距 < 1 秒）一律放行，兼顾改密后立即登录的新 Token。
            long markerSeconds = Long.parseLong(marker) / 1000;
            long issuedAtSeconds = issuedAtEpochMillis / 1000;
            return issuedAtSeconds < markerSeconds;
        } catch (NumberFormatException e) {
            log.warn("改密标记值格式异常 userId={}", userId);
            return false;
        }
    }

    /** 验证码 Key（包内可见，便于测试与 Key 规则统一维护） */
    public String resetCodeKey(String email) {
        return cacheProperties.getVerifyPrefix() + "reset:code:" + email;
    }

    /** 验证码尝试计数 Key */
    public String resetAttemptsKey(String email) {
        return cacheProperties.getVerifyPrefix() + "reset:attempts:" + email;
    }

    /** 验证码发送冷却 Key */
    public String resetCooldownKey(String email) {
        return cacheProperties.getVerifyPrefix() + "reset:cooldown:" + email;
    }

    /** 改密时间标记 Key */
    public String passwordChangeMarkerKey(String userId) {
        return cacheProperties.getSecurityPrefix() + "pwd-change:" + userId;
    }

    // ==================== 业务数据缓存（Cache Aside） ====================

    /**
     * 读取缓存（未命中返回 null）
     */
    public <T> T get(String key, Class<T> clazz) {
        try {
            String value = stringRedisTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            if (EMPTY_VALUE.equals(value)) {
                // 空值命中：返回 null 由调用方短路
                return null;
            }
            return objectMapper.readValue(value, clazz);
        } catch (Exception e) {
            log.warn("缓存读取失败 key={}, 原因: {}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 读取缓存（保留泛型信息，适用于 List&lt;Entity&gt;/Map&lt;String,Entity&gt; 等复合类型）
     */
    public <T> T get(String key, TypeReference<T> typeRef) {
        try {
            String value = stringRedisTemplate.opsForValue().get(key);
            if (value == null || EMPTY_VALUE.equals(value)) {
                return null;
            }
            return objectMapper.readValue(value, typeRef);
        } catch (Exception e) {
            log.warn("缓存读取失败 key={}, 原因: {}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 是否缓存了空值（防穿透判断）
     */
    public boolean isEmptyCached(String key) {
        return EMPTY_VALUE.equals(stringRedisTemplate.opsForValue().get(key));
    }

    /**
     * 写入缓存，TTL 加 ±10% 随机抖动（防雪崩）
     */
    public void put(String key, Object value, long ttlSeconds) {
        try {
            long jittered = ttlSeconds + ThreadLocalRandom.current().nextLong(-ttlSeconds / 10, ttlSeconds / 10 + 1);
            stringRedisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(value),
                    Duration.ofSeconds(Math.max(jittered, 1)));
        } catch (Exception e) {
            log.warn("缓存写入失败 key={}, 原因: {}", key, e.getMessage());
        }
    }

    /**
     * 缓存空值（查询 DB 也不存在时，防穿透）
     */
    public void putEmpty(String key) {
        stringRedisTemplate.opsForValue().set(key, EMPTY_VALUE, Duration.ofSeconds(EMPTY_TTL_SECONDS));
    }

    /**
     * 写操作后删除缓存（Cache Aside 写后失效）
     */
    public void evict(String... keys) {
        for (String key : keys) {
            stringRedisTemplate.delete(key);
        }
    }

    /**
     * 按模式删除（如 report:monthly:{userId}:*）
     */
    public void evictByPattern(String pattern) {
        var keys = stringRedisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
        }
    }

    // ==================== 业务 Key 构建 ====================

    /**
     * 分类列表 Key（含 user 维度：系统预设 user=null，自定义 user=userId）
     */
    public String categoryListKey(String userId) {
        return cacheProperties.getCategoryPrefix() + "list:" + (userId == null ? "system" : userId);
    }

    /**
     * 分类列表缓存通配（用于用户分类变更时批量失效 system + 当前用户 key）
     */
    public String categoryListPattern(String userId) {
        return cacheProperties.getCategoryPrefix() + "list:*";
    }

    public String accountListKey(String userId) {
        return cacheProperties.getAccountPrefix() + "list:" + userId;
    }

    public String reportMonthlyKey(String userId, String month) {
        return cacheProperties.getReportPrefix() + "monthly:" + userId + ":" + month;
    }

    /** 月度统计 Key 前缀（含通配匹配用） */
    public String reportMonthlyPrefix() {
        return cacheProperties.getReportPrefix() + "monthly:";
    }

    public String reportTrendKey(String userId) {
        return cacheProperties.getReportPrefix() + "trend:" + userId;
    }

    public String budgetExecKey(String userId, String month) {
        return cacheProperties.getBudgetPrefix() + "exec:" + userId + ":" + month;
    }

    /** 预算执行 Key 前缀（含通配匹配用） */
    public String budgetExecPrefix() {
        return cacheProperties.getBudgetPrefix() + "exec:";
    }
}

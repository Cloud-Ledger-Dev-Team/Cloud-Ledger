package com.cloudledger.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Redis 缓存 Key 前缀与 TTL 配置（对应 application.yml 的 cache.redis.*）
 */
@Data
@Component
@ConfigurationProperties(prefix = "cache.redis")
public class CacheProperties {

    /** 登录会话 Key 前缀 */
    private String sessionPrefix = "cloud-ledger:session:";

    /** 分类列表 Key 前缀 */
    private String categoryPrefix = "cloud-ledger:category:";

    /** 用户账户列表 Key 前缀 */
    private String accountPrefix = "cloud-ledger:account:";

    /** 报表统计 Key 前缀 */
    private String reportPrefix = "cloud-ledger:report:";

    /** 预算执行 Key 前缀 */
    private String budgetPrefix = "cloud-ledger:budget:";

    /** 验证码 Key 前缀 */
    private String verifyPrefix = "cloud-ledger:verify:";

    /** 安全标记 Key 前缀（如改密时间标记） */
    private String securityPrefix = "cloud-ledger:security:";

    /** 会话 TTL（秒，30 min） */
    private long ttlSession = 1800;

    /** 分类列表 TTL（秒，60 min） */
    private long ttlCategory = 3600;

    /** 账户列表 TTL（秒，10 min） */
    private long ttlAccount = 600;

    /** 月度统计 TTL（秒，30 min） */
    private long ttlReportMonthly = 1800;

    /** 趋势统计 TTL（秒，1 hour） */
    private long ttlReportTrend = 3600;

    /** 预算执行 TTL（秒，30 min） */
    private long ttlBudgetExec = 1800;
}

package com.cloudledger;

import com.cloudledger.common.cache.CacheService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Properties;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cloud-Ledger 接口级集成测试
 * <p>
 * 基于 @SpringBootTest + MockMvc，连接真实 MySQL 与 Redis，
 * 覆盖用户 / 账户 / 账单 / 预算 / 分类 / 报表 / 交易 / 反馈 8 大模块核心链路，
 * 并回归验证「账户列表缓存反序列化」修复（连续两次查询命中缓存不抛异常）。
 * </p>
 * <p>执行结束后在标准输出打印【汇总】 X/Y 用例通过。</p>
 */
// 注入模拟 SMTP 配置使发信业务链路可执行；JavaMailSender 已被 @MockBean 替换，不会产生真实网络连接
@Slf4j
@SpringBootTest(properties = {
        "spring.mail.host=smtp.test.local",
        "spring.mail.username=no-reply@cloud-ledger.test"
})
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CloudLedgerIntegrationTest {

    private static final AtomicInteger PASSED = new AtomicInteger();
    private static final AtomicInteger FAILED = new AtomicInteger();
    private static final AtomicInteger TOTAL = new AtomicInteger();

    @RegisterExtension
    static final TestWatcher WATCHER = new TestWatcher() {
        @Override
        public void testSuccessful(ExtensionContext context) {
            PASSED.incrementAndGet();
            TOTAL.incrementAndGet();
        }

        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            FAILED.incrementAndGet();
            TOTAL.incrementAndGet();
            log.warn("[失败] {} -> {}", context.getDisplayName(), cause.getMessage());
        }

        @Override
        public void testAborted(ExtensionContext context, Throwable cause) {
            TOTAL.incrementAndGet();
        }
    };

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private CacheService cacheService;

    /** 邮件发送替身：不触发真实 SMTP，仅验证调用行为 */
    @MockBean
    private JavaMailSender mailSender;

    /** 测试用户邮箱（随机，避免唯一约束冲突） */
    private final String email = "it_" + System.currentTimeMillis() + "@test.com";
    private final String password = "Passw0rd123";

    private String token;
    private String userId;
    private String accountId;
    private String billId;
    private String budgetId;
    private String transactionId;

    /** 密码模块专用测试用户（独立数据，避免干扰主流程断言） */
    private final String pwdEmail = "pwd_" + System.currentTimeMillis() + "@test.com";
    private final String pwdInitPassword = "Passw0rd123";
    private final String pwdAfterReset = "NewPass456";
    private final String pwdAfterChange = "Change789";
    private String pwdUserId;
    private String pwdToken;

    /**
     * 每个用例前重置邮件替身：createMimeMessage 返回可用空消息（Mock 默认返回 null 会导致构造失败），
     * send 为 no-op，不访问真实 SMTP。
     */
    @BeforeEach
    void initMailSender() {
        reset(mailSender);
        when(mailSender.createMimeMessage())
                .thenReturn(new MimeMessage(Session.getInstance(new Properties())));
    }

    @BeforeAll
    void cleanRedis() {
        try {
            stringRedisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        } catch (Exception ignored) {
            // Redis 不可用时降级为不清理，测试仍依赖 DB 回源
        }
    }

    @AfterAll
    void printSummary() {
        log.info("==================================================");
        log.info("【汇总】 {}/{} 用例通过{}", PASSED.get(), TOTAL.get(),
                FAILED.get() > 0 ? "，失败 " + FAILED.get() : "");
        log.info("==================================================");
    }

    // ==================== 辅助方法 ====================

    private ResultActions postJson(String url, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private ResultActions putJson(String url, Map<String, Object> body) throws Exception {
        return mockMvc.perform(put(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private String json(MvcResult result, String path) throws Exception {
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return JsonPath.read(body, path);
    }

    // ==================== 用户模块 ====================

    @Test
    @Order(1)
    void healthCheck() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    @Order(2)
    void registerSuccess() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "集成测试用户");
        body.put("email", email);
        body.put("password", password);

        MvcResult result = postJson("/api/register", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.user.user_id").exists())
                .andReturn();
        userId = json(result, "$.data.user.user_id");
    }

    @Test
    @Order(3)
    void registerDuplicateEmail() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "重复用户");
        body.put("email", email);
        body.put("password", password);

        postJson("/api/register", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value("该邮箱已被注册"));
    }

    @Test
    @Order(4)
    void registerWeakPassword() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "弱密码用户");
        body.put("email", "weak_" + System.currentTimeMillis() + "@test.com");
        body.put("password", "12345678");

        postJson("/api/register", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @Order(5)
    void loginSuccess() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("password", password);

        MvcResult result = postJson("/api/login", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.access_token").exists())
                .andExpect(jsonPath("$.data.user.user_id").value(userId))
                .andReturn();
        token = json(result, "$.data.token");
    }

    @Test
    @Order(6)
    void loginWrongPassword() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("password", "WrongPass0rd");

        postJson("/api/login", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    // ==================== 分类模块 ====================

    @Test
    @Order(7)
    void getCategories() throws Exception {
        mockMvc.perform(get("/api/categories/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                // 新接口返回 { categories: [...完整对象], groups: { income: [...], expense: [...] } }
                .andExpect(jsonPath("$.data.groups.income").isArray())
                .andExpect(jsonPath("$.data.groups.expense").isArray());
    }

    // ==================== 账户模块 ====================

    @Test
    @Order(8)
    void accountListTwiceHitCache() throws Exception {
        // 第一次查询：回源 DB 并写缓存
        MvcResult first = mockMvc.perform(get("/api/accounts").param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accounts").isArray())
                .andExpect(jsonPath("$.data.accounts[0].account_id").exists())
                .andReturn();
        accountId = json(first, "$.data.accounts[0].account_id");

        // 第二次查询：命中缓存（回归验证 TypeReference 反序列化修复）
        mockMvc.perform(get("/api/accounts").param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accounts[0].account_id").value(accountId))
                .andExpect(jsonPath("$.data.accounts[0].balance").value(0.0));
    }

    @Test
    @Order(9)
    void accountListMissingUserId() throws Exception {
        mockMvc.perform(get("/api/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    // ==================== 账单模块（余额联动） ====================

    @Test
    @Order(11)
    void createBillWithBalanceSync() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("account_id", accountId);
        body.put("type", "expense");
        body.put("category", "餐饮");
        body.put("amount", 88.50);
        body.put("date", "2026-10-09");
        body.put("description", "集成测试午餐");

        MvcResult result = postJson("/api/bills", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        // 接口文档 5.2 成功响应仅返回成功状态，无 bill_id

        // 余额联动：默认账户 0.00 - 88.50 = -88.50（写操作已失效账户缓存，重新回源）
        mockMvc.perform(get("/api/accounts").param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accounts[0].balance").value(-88.5));
    }

    @Test
    @Order(12)
    void listBills() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/bills")
                        .param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.bills").isArray())
                .andExpect(jsonPath("$.data.bills[0].category").value("餐饮"))
                .andExpect(jsonPath("$.data.bills[0].amount").value(88.5))
                .andReturn();
        billId = json(result, "$.data.bills[0].bill_id");
    }

    @Test
    @Order(13)
    void updateBill() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", 128.50);
        body.put("category", "餐饮");
        body.put("date", "2026-10-09");
        body.put("description", "晚餐聚餐(更新后)");

        putJson("/api/bills/" + billId, body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.bill.bill_id").value(billId))
                .andExpect(jsonPath("$.data.bill.amount").value(128.5));
    }

    @Test
    @Order(14)
    void deleteBill() throws Exception {
        mockMvc.perform(delete("/api/bills/" + billId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        // 删除后余额恢复为 0.00
        mockMvc.perform(get("/api/accounts").param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accounts[0].balance").value(0.0));
    }

    // ==================== 预算模块 ====================

    @Test
    @Order(15)
    void setAndGetBudget() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("month", "2026-10");
        body.put("amount", 5000.00);

        MvcResult result = postJson("/api/budgets/", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.budget.month").value("2026-10"))
                .andReturn();
        budgetId = json(result, "$.data.budget.budget_id");

        mockMvc.perform(get("/api/budgets/" + userId + "/2026-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.budget.amount").value(5000.0));
    }

    @Test
    @Order(16)
    void updateBudgetAmount() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", 6000.00);

        putJson("/api/budgets/" + budgetId, body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.budget.amount").value(6000.0));
    }

    // ==================== 报表模块 ====================

    @Test
    @Order(17)
    void monthlyStats() throws Exception {
        mockMvc.perform(get("/api/analytics/monthly/" + userId + "/2026-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.stats.month").value("2026-10"))
                .andExpect(jsonPath("$.data.stats.budget").value(6000.0))
                .andExpect(jsonPath("$.data.stats.expense").value(0.0));
    }

    @Test
    @Order(18)
    void trend() throws Exception {
        mockMvc.perform(get("/api/analytics/trend/" + userId).param("months", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.trends.length()").value(6));
    }

    // ==================== 交易记录模块 ====================

    @Test
    @Order(19)
    void createTransaction() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("amount", 200.00);
        body.put("type", "expense");
        body.put("category", "交通");
        body.put("date", "2026-10-09");
        body.put("description", "打车");

        MvcResult result = postJson("/api/transactions/", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.transaction.transaction_id").exists())
                .andReturn();
        transactionId = json(result, "$.data.transaction.transaction_id");

        mockMvc.perform(get("/api/transactions/").param("user_id", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.transactions").isArray());
    }

    @Test
    @Order(20)
    void deleteTransaction() throws Exception {
        mockMvc.perform(delete("/api/transactions/" + transactionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ==================== 反馈模块（强制鉴权） ====================

    @Test
    @Order(21)
    void feedbackUnauthorized() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "Bug");
        body.put("content", "未登录提交反馈");

        postJson("/api/feedback", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    @Order(22)
    void feedbackAuthorized() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "建议");
        body.put("content", "希望支持月度预算饼图导出");
        body.put("contact", email);

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.feedback_id").exists());
    }

    @Test
    @Order(23)
    void logout() throws Exception {
        mockMvc.perform(post("/api/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ==================== 账户模块（创建第二账户，置于末尾避免干扰 accounts[0] 断言） ====================

    @Test
    @Order(24)
    void createAccount() throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user_id", userId);
        body.put("name", "建设银行储蓄卡");
        body.put("type", "银行卡");
        body.put("balance", 5000.00);

        postJson("/api/accounts", body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.account.account_id").exists());
    }

    // ==================== 密码安全模块 ====================

    /** 读取 Redis 中当前有效的重置验证码 */
    private String currentResetCode(String mail) {
        return stringRedisTemplate.opsForValue().get(cacheService.resetCodeKey(mail));
    }

    private Map<String, Object> resetCodeRequestBody(String mail) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", mail);
        return body;
    }

    private Map<String, Object> resetRequestBody(String mail, String code,
                                                 String newPwd, String confirmPwd) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", mail);
        body.put("code", code);
        body.put("new_password", newPwd);
        body.put("confirm_password", confirmPwd);
        return body;
    }

    @Test
    @Order(25)
    void pwdUserRegisterAndLogin() throws Exception {
        Map<String, Object> reg = new LinkedHashMap<>();
        reg.put("name", "密码模块测试用户");
        reg.put("email", pwdEmail);
        reg.put("password", pwdInitPassword);

        MvcResult regResult = postJson("/api/register", reg)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        pwdUserId = json(regResult, "$.data.user.user_id");

        MvcResult loginResult = postJson("/api/login",
                        Map.of("email", pwdEmail, "password", pwdInitPassword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andReturn();
        pwdToken = json(loginResult, "$.data.token");
    }

    @Test
    @Order(26)
    void sendResetCodeUnknownEmailAntiEnumeration() throws Exception {
        String unknownEmail = "nobody_" + System.currentTimeMillis() + "@test.com";

        postJson("/api/password/forgot/code", resetCodeRequestBody(unknownEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.msg").value("若该邮箱已注册，验证码将发送至邮箱"))
                .andExpect(jsonPath("$.data.expire_seconds").value(300))
                .andExpect(jsonPath("$.data.resend_cooldown").value(60));

        // 不写验证码 Key、不发信
        org.junit.jupiter.api.Assertions.assertFalse(
                stringRedisTemplate.hasKey(cacheService.resetCodeKey(unknownEmail)));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @Order(27)
    void sendResetCodeRegisteredEmail() throws Exception {
        postJson("/api/password/forgot/code", resetCodeRequestBody(pwdEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.msg").value("若该邮箱已注册，验证码将发送至邮箱"));

        String code = currentResetCode(pwdEmail);
        org.junit.jupiter.api.Assertions.assertNotNull(code);
        org.junit.jupiter.api.Assertions.assertTrue(code.matches("^\\d{6}$"));
        org.junit.jupiter.api.Assertions.assertTrue(
                stringRedisTemplate.hasKey(cacheService.resetCooldownKey(pwdEmail)));
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @Order(28)
    void resendResetCodeInCooldown() throws Exception {
        String codeBefore = currentResetCode(pwdEmail);

        postJson("/api/password/forgot/code", resetCodeRequestBody(pwdEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(429))
                .andExpect(jsonPath("$.msg").value("验证码发送过于频繁，请稍后再试"));

        // 冷却期内不重新生成验证码
        org.junit.jupiter.api.Assertions.assertEquals(codeBefore, currentResetCode(pwdEmail));
    }

    @Test
    @Order(29)
    void wrongCodeFiveAttemptsThenResend() throws Exception {
        // 连续 5 次错误验证码：前 4 次普通错误，第 5 次作废
        for (int i = 1; i <= 4; i++) {
            postJson("/api/password/forgot/reset",
                            resetRequestBody(pwdEmail, "00000" + (i % 10), pwdAfterReset, pwdAfterReset))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(400))
                    .andExpect(jsonPath("$.msg").value("验证码错误"));
        }
        postJson("/api/password/forgot/reset",
                        resetRequestBody(pwdEmail, "999999", pwdAfterReset, pwdAfterReset))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value("验证码错误次数过多，请重新获取"));

        // 验证码已作废：Key 不存在
        org.junit.jupiter.api.Assertions.assertFalse(
                stringRedisTemplate.hasKey(cacheService.resetCodeKey(pwdEmail)));

        // 作废后可立即重新获取验证码（冷却已随作废清理）
        postJson("/api/password/forgot/code", resetCodeRequestBody(pwdEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
        org.junit.jupiter.api.Assertions.assertNotNull(currentResetCode(pwdEmail));
    }

    @Test
    @Order(30)
    void resetPasswordValidationErrors() throws Exception {
        String validCode = currentResetCode(pwdEmail);

        // 弱密码（纯数字）
        postJson("/api/password/forgot/reset",
                        resetRequestBody(pwdEmail, validCode, "12345678", "12345678"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));

        // 两次密码不一致
        postJson("/api/password/forgot/reset",
                        resetRequestBody(pwdEmail, validCode, pwdAfterReset, "NewPass457"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value("两次输入的密码不一致"));

        // 新密码与旧密码相同
        postJson("/api/password/forgot/reset",
                        resetRequestBody(pwdEmail, validCode, pwdInitPassword, pwdInitPassword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value("新密码不能与旧密码相同"));

        // 输入类错误不消费验证码，仍可用于下一步成功重置
        org.junit.jupiter.api.Assertions.assertEquals(validCode, currentResetCode(pwdEmail));
    }

    @Test
    @Order(31)
    void resetPasswordSuccessInvalidatesOldToken() throws Exception {
        String validCode = currentResetCode(pwdEmail);

        postJson("/api/password/forgot/reset",
                        resetRequestBody(pwdEmail, validCode, pwdAfterReset, pwdAfterReset))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.msg").value("密码重置成功，请使用新密码登录"));

        // 验证码相关 Key 全部清除
        org.junit.jupiter.api.Assertions.assertFalse(
                stringRedisTemplate.hasKey(cacheService.resetCodeKey(pwdEmail)));
        org.junit.jupiter.api.Assertions.assertFalse(
                stringRedisTemplate.hasKey(cacheService.resetAttemptsKey(pwdEmail)));

        // 旧密码登录失败
        postJson("/api/login", Map.of("email", pwdEmail, "password", pwdInitPassword))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        // 重置前签发的 Token 被改密标记拦截
        Map<String, Object> feedback = new LinkedHashMap<>();
        feedback.put("type", "建议");
        feedback.put("content", "改密后旧 Token 访问");
        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + pwdToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedback)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        // 新密码登录成功，记录新 Token
        MvcResult loginResult = postJson("/api/login",
                        Map.of("email", pwdEmail, "password", pwdAfterReset))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.token").exists())
                .andReturn();
        pwdToken = json(loginResult, "$.data.token");
    }

    @Test
    @Order(32)
    void changePasswordFlow() throws Exception {
        // 匿名访问被拒
        postJson("/api/password/change",
                        Map.of("old_password", pwdAfterReset,
                                "new_password", pwdAfterChange, "confirm_password", pwdAfterChange))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        // 原密码错误
        Map<String, Object> wrongOld = new LinkedHashMap<>();
        wrongOld.put("old_password", "WrongOld000");
        wrongOld.put("new_password", pwdAfterChange);
        wrongOld.put("confirm_password", pwdAfterChange);
        mockMvc.perform(post("/api/password/change")
                        .header("Authorization", "Bearer " + pwdToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOld)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.msg").value("原密码不正确"));

        // 成功修改
        Map<String, Object> okBody = new LinkedHashMap<>();
        okBody.put("old_password", pwdAfterReset);
        okBody.put("new_password", pwdAfterChange);
        okBody.put("confirm_password", pwdAfterChange);
        mockMvc.perform(post("/api/password/change")
                        .header("Authorization", "Bearer " + pwdToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(okBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.msg").value("密码修改成功，请重新登录"));

        // 当前 Token 已被拉黑
        Map<String, Object> feedbackBody = new LinkedHashMap<>();
        feedbackBody.put("type", "建议");
        feedbackBody.put("content", "改密后当前 Token 访问");
        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", "Bearer " + pwdToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedbackBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));

        // 旧密码登录失败、新密码登录成功
        postJson("/api/login", Map.of("email", pwdEmail, "password", pwdAfterReset))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401));
        postJson("/api/login", Map.of("email", pwdEmail, "password", pwdAfterChange))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}

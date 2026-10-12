package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Account;
import com.cloudledger.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 账户模块控制器（列表 / 创建 / 更新 / 删除）
 */
@Tag(name = "账户模块", description = "账户增删改查")
@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @Operation(summary = "获取账户列表", description = "查询指定用户的所有账户（Redis 缓存 10 分钟）")
    @GetMapping({"", "/"})
    public Result<Map<String, Object>> list(
            @Parameter(description = "用户 ID") @RequestParam(value = "user_id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return Result.error(400, "缺少 user_id 参数");
        }
        List<Account> accounts = accountService.listByUserId(userId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Account a : accounts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("account_id", a.getAccountId());
            item.put("name", a.getName());
            item.put("type", a.getType());
            item.put("balance", a.getBalance());
            items.add(item);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("accounts", items);
        return Result.success(data);
    }

    @Operation(summary = "创建账户", description = "为指定用户新增账户；type 默认「现金」，balance 默认 0")
    @PostMapping({"", "/"})
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("user_id");
        String name = (String) request.get("name");
        String type = (String) request.get("type");
        BigDecimal balance = toBigDecimal(request.get("balance"));
        if (userId == null || name == null) {
            return Result.error(400, "缺少必填字段：user_id/name");
        }
        Account account = accountService.create(userId, name, type, balance);
        Map<String, Object> accountMap = new LinkedHashMap<>();
        accountMap.put("account_id", account.getAccountId());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("account", accountMap);
        return Result.success(data);
    }

    @Operation(summary = "更新账户", description = "更新账户名称与余额（只更新请求体中包含的字段）")
    @PutMapping("/{accountId}")
    public Result<Void> update(
            @PathVariable String accountId,
            @RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        BigDecimal balance = toBigDecimal(request.get("balance"));
        boolean updated = accountService.update(accountId, name, balance);
        if (!updated) {
            return Result.error(400, "账户不存在");
        }
        return Result.success();
    }

    @Operation(summary = "删除账户", description = "删除账户并级联删除其下所有账单（不可恢复）")
    @DeleteMapping("/{accountId}")
    public Result<Void> delete(@PathVariable String accountId) {
        boolean deleted = accountService.delete(accountId);
        if (!deleted) {
            return Result.error(400, "账户不存在");
        }
        return Result.success();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}

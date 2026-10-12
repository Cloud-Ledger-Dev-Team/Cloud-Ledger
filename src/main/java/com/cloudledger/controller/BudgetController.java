package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Budget;
import com.cloudledger.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 预算模块控制器（设置/更新、查询、修改金额）
 */
@Tag(name = "预算模块", description = "月度预算管理")
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @Operation(summary = "设置/更新月度预算", description = "为指定用户设置某月预算；该月已存在预算则更新金额（upsert）")
    @PostMapping({"", "/"})
    public Result<Map<String, Object>> setBudget(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("user_id");
        String month = (String) request.get("month");
        BigDecimal amount = toBigDecimal(request.get("amount"));
        if (userId == null || month == null || amount == null) {
            return Result.error(400, "缺少必填字段：user_id/month/amount");
        }
        Budget budget = budgetService.upsert(userId, month, amount);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("budget", toBudgetMap(budget));
        return Result.success(data);
    }

    @Operation(summary = "查询指定月份预算")
    @GetMapping("/{userId}/{month}")
    public Result<Map<String, Object>> getBudget(
            @Parameter(description = "用户 ID") @PathVariable String userId,
            @Parameter(description = "月份 YYYY-MM") @PathVariable String month) {
        Budget budget = budgetService.getByUserAndMonth(userId, month);
        if (budget == null) {
            return Result.error(400, "该月暂无预算设置");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("budget", toBudgetMap(budget));
        return Result.success(data);
    }

    @Operation(summary = "修改预算金额", description = "根据 budget_id 修改预算金额")
    @PutMapping("/{budgetId}")
    public Result<Map<String, Object>> updateBudget(
            @PathVariable String budgetId,
            @RequestBody Map<String, Object> request) {
        BigDecimal amount = toBigDecimal(request.get("amount"));
        if (amount == null) {
            return Result.error(400, "缺少必填字段：amount");
        }
        Budget budget = budgetService.updateAmount(budgetId, amount);
        if (budget == null) {
            return Result.error(400, "预算不存在");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("budget", toBudgetMap(budget));
        return Result.success(data);
    }

    private static Map<String, Object> toBudgetMap(Budget budget) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("budget_id", budget.getBudgetId());
        map.put("user_id", budget.getUserId());
        map.put("month", budget.getMonth());
        map.put("amount", budget.getAmount());
        return map;
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
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

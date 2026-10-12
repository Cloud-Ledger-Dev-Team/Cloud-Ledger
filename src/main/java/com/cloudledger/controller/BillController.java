package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Bill;
import com.cloudledger.service.BillService;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 账单模块控制器（增删改查 + 余额联动）
 */
@Tag(name = "账单模块", description = "账单增删改查，自动联动账户余额")
@RestController
@RequestMapping("/api/bills")
public class BillController {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private BillService billService;

    @Operation(summary = "获取账单列表", description = "按类型、起止日期筛选，结果按日期倒序")
    @GetMapping({"", "/"})
    public Result<Map<String, Object>> list(
            @RequestParam(value = "user_id", required = false) String userId,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate) {
        if (userId == null || userId.isBlank()) {
            return Result.error(400, "缺少 user_id");
        }
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        if (startDate != null && start == null) {
            return Result.error(400, "startDate 格式错误，应为 YYYY-MM-DD");
        }
        if (endDate != null && end == null) {
            return Result.error(400, "endDate 格式错误，应为 YYYY-MM-DD");
        }
        List<Bill> bills = billService.list(userId, type, start, end);

        List<Map<String, Object>> items = new ArrayList<>();
        for (Bill b : bills) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("bill_id", b.getBillId());
            item.put("type", b.getType());
            item.put("category", b.getCategory());
            item.put("amount", b.getAmount());
            item.put("date", b.getDate() == null ? null : b.getDate().format(DATE_FORMAT));
            item.put("description", b.getDescription());
            items.add(item);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("bills", items);
        return Result.success(data);
    }

    @Operation(summary = "创建账单", description = "新增账单并按 type 自动调整账户余额（income +，expense -），事务保证一致性")
    @PostMapping({"", "/"})
    public Result<Void> create(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("user_id");
        String accountId = (String) request.get("account_id");
        String type = (String) request.get("type");
        String category = (String) request.get("category");
        BigDecimal amount = toBigDecimal(request.get("amount"));
        LocalDate date = parseDate((String) request.get("date"));
        String description = request.get("description") == null ? "" : request.get("description").toString();

        if (userId == null || accountId == null || type == null || category == null
                || amount == null || date == null) {
            return Result.error(400, "缺少必填字段：user_id/account_id/type/category/amount/date");
        }
        if (!"income".equals(type) && !"expense".equals(type)) {
            return Result.error(400, "type 仅支持 income / expense");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Result.error(400, "金额必须大于 0");
        }
        billService.create(userId, accountId, type, category, amount, date, description);
        return Result.success();
    }

    @Operation(summary = "更新账单", description = "恢复原账户余额并应用新值；若 account_id 变更则同步迁移余额影响")
    @PutMapping("/{billId}")
    public Result<Map<String, Object>> update(
            @Parameter(description = "账单 ID") @PathVariable String billId,
            @RequestBody Map<String, Object> request) {
        BigDecimal amount = toBigDecimal(request.get("amount"));
        String category = (String) request.get("category");
        LocalDate date = parseDate((String) request.get("date"));
        String description = request.get("description") == null ? null : request.get("description").toString();
        String accountId = (String) request.get("account_id");

        if (amount == null || category == null || date == null) {
            return Result.error(400, "缺少必填字段：amount/category/date");
        }
        Bill bill = billService.update(billId, amount, category, date, description, accountId);
        if (bill == null) {
            return Result.error(400, "账单不存在");
        }

        Map<String, Object> billMap = new LinkedHashMap<>();
        billMap.put("bill_id", bill.getBillId());
        billMap.put("user_id", bill.getUserId());
        billMap.put("type", bill.getType());
        billMap.put("category", bill.getCategory());
        billMap.put("amount", bill.getAmount());
        billMap.put("date", bill.getDate() == null ? null : bill.getDate().format(DATE_FORMAT));
        billMap.put("description", bill.getDescription());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("bill", billMap);
        return Result.success("账单更新成功", data);
    }

    @Operation(summary = "删除账单", description = "删除账单并恢复对应账户余额（income 减，expense 加）")
    @DeleteMapping("/{billId}")
    public Result<Void> delete(@PathVariable String billId) {
        boolean deleted = billService.delete(billId);
        if (!deleted) {
            return Result.error(400, "账单不存在");
        }
        return Result.success("账单删除成功", null);
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value, DATE_FORMAT);
        } catch (DateTimeParseException e) {
            return null;
        }
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

package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.entity.Bill;
import com.cloudledger.service.TransactionService;
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
 * 交易记录模块控制器（流水式收支记录，与账单模块共用 bill 表）
 */
@Tag(name = "交易记录模块", description = "流水式收支记录（不联动账户余额）")
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private TransactionService transactionService;

    @Operation(summary = "添加交易记录", description = "新增一笔交易记录（等同于不联动账户余额的账单）")
    @PostMapping({"", "/"})
    public Result<Map<String, Object>> create(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("user_id");
        BigDecimal amount = toBigDecimal(request.get("amount"));
        String type = (String) request.get("type");
        String category = (String) request.get("category");
        LocalDate date = parseDate((String) request.get("date"));
        String description = request.get("description") == null ? "" : request.get("description").toString();

        if (userId == null || amount == null || type == null || category == null || date == null) {
            return Result.error(400, "缺少必填字段：user_id/amount/type/category/date");
        }
        if (!"income".equals(type) && !"expense".equals(type)) {
            return Result.error(400, "type 仅支持 income / expense");
        }
        Bill bill = transactionService.create(userId, amount, type, category, date, description);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("transaction", toTransactionMap(bill));
        return Result.success("交易记录添加成功", data);
    }

    @Operation(summary = "获取交易记录列表", description = "查询指定用户的所有交易记录，按日期倒序")
    @GetMapping({"", "/"})
    public Result<Map<String, Object>> list(
            @RequestParam(value = "user_id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            return Result.error(400, "缺少用户ID参数");
        }
        List<Bill> bills = transactionService.list(userId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Bill b : bills) {
            items.add(toTransactionMap(b));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("transactions", items);
        return Result.success(data);
    }

    @Operation(summary = "更新交易记录", description = "按字段更新交易记录（只更新请求体中包含的字段）")
    @PutMapping("/{transactionId}")
    public Result<Map<String, Object>> update(
            @Parameter(description = "交易 ID") @PathVariable String transactionId,
            @RequestBody Map<String, Object> request) {
        BigDecimal amount = toBigDecimal(request.get("amount"));
        String type = (String) request.get("type");
        String category = (String) request.get("category");
        String description = request.get("description") == null ? null : request.get("description").toString();
        LocalDate date = parseDate((String) request.get("date"));

        if (type != null && !"income".equals(type) && !"expense".equals(type)) {
            return Result.error(400, "type 仅支持 income / expense");
        }
        Bill bill = transactionService.update(transactionId, amount, type, category, description, date);
        if (bill == null) {
            return Result.error(400, "交易记录不存在");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("transaction", toTransactionMap(bill));
        return Result.success("交易记录更新成功", data);
    }

    @Operation(summary = "删除交易记录", description = "删除指定交易记录（不回滚账户余额，如需联动请走账单模块）")
    @DeleteMapping("/{transactionId}")
    public Result<Void> delete(@PathVariable String transactionId) {
        boolean deleted = transactionService.delete(transactionId);
        if (!deleted) {
            return Result.error(400, "交易记录不存在");
        }
        return Result.success("交易记录删除成功", null);
    }

    private static Map<String, Object> toTransactionMap(Bill bill) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("transaction_id", bill.getBillId());
        map.put("user_id", bill.getUserId());
        map.put("amount", bill.getAmount());
        map.put("type", bill.getType());
        map.put("category", bill.getCategory());
        map.put("description", bill.getDescription());
        map.put("date", bill.getDate() == null ? null : bill.getDate().format(DATE_FORMAT));
        return map;
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

package com.cloudledger.controller;

import com.cloudledger.common.response.Result;
import com.cloudledger.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 数据分析模块控制器（月度统计 / 多月份趋势）
 */
@Tag(name = "数据分析模块", description = "月度收支统计与趋势分析")
@RestController
@RequestMapping("/api/analytics")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Operation(summary = "月度收支统计", description = "统计指定月份的总收入、总支出、结余、预算执行率、分类支出明细（Redis 缓存 30 分钟）")
    @GetMapping("/monthly/{userId}/{month}")
    public Result<Map<String, Object>> monthly(
            @Parameter(description = "用户 ID") @PathVariable String userId,
            @Parameter(description = "月份 YYYY-MM") @PathVariable String month) {
        Map<String, Object> stats;
        try {
            stats = reportService.monthlyStats(userId, month);
        } catch (Exception e) {
            return Result.error(400, "月份格式错误，应为 YYYY-MM");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("stats", stats);
        return Result.success(data);
    }

    @Operation(summary = "多月份收支趋势", description = "按月回溯统计最近 N 个月的收支数据（Redis 缓存 1 小时）")
    @GetMapping("/trend/{userId}")
    public Result<Map<String, Object>> trend(
            @Parameter(description = "用户 ID") @PathVariable String userId,
            @Parameter(description = "回溯月份数，需为正整数") @RequestParam(value = "months", defaultValue = "6") String months) {
        int monthCount;
        try {
            monthCount = Integer.parseInt(months);
        } catch (NumberFormatException e) {
            return Result.error(400, "months 须为正整数");
        }
        if (monthCount <= 0) {
            return Result.error(400, "months 须为正整数");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("trends", reportService.trend(userId, monthCount));
        return Result.success(data);
    }
}

package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.config.CacheProperties;
import com.cloudledger.entity.Bill;
import com.cloudledger.entity.Budget;
import com.cloudledger.mapper.BillMapper;
import com.cloudledger.mapper.BudgetMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 报表分析模块业务逻辑
 * - 月度收支统计（收入/支出/结余/预算执行率/分类明细），Redis 缓存 30 min
 * - 多月份收支趋势，Redis 缓存 1 hour
 */
@Slf4j
@Service
public class ReportService {

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private BudgetMapper budgetMapper;

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProperties cacheProperties;

    /**
     * 月度收支统计
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> monthlyStats(String userId, String month) {
        String key = cacheService.reportMonthlyKey(userId, month);
        Map<String, Object> cached = cacheService.get(key, Map.class);
        if (cached != null) {
            return cached;
        }

        YearMonth ym = YearMonth.parse(month, MONTH_FORMAT);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.plusMonths(1).atDay(1);

        List<Bill> bills = billMapper.selectList(new LambdaQueryWrapper<Bill>()
                .eq(Bill::getUserId, userId)
                .ge(Bill::getDate, start)
                .lt(Bill::getDate, end));

        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        Map<String, BigDecimal> categoryStats = new LinkedHashMap<>();
        for (Bill bill : bills) {
            if ("income".equals(bill.getType())) {
                income = income.add(bill.getAmount());
            } else {
                expense = expense.add(bill.getAmount());
                categoryStats.merge(bill.getCategory(), bill.getAmount(), BigDecimal::add);
            }
        }
        BigDecimal balance = income.subtract(expense);

        Budget budget = budgetMapper.selectOne(new LambdaQueryWrapper<Budget>()
                .eq(Budget::getUserId, userId)
                .eq(Budget::getMonth, month));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("month", month);
        stats.put("income", round2(income));
        stats.put("expense", round2(expense));
        stats.put("balance", round2(balance));
        stats.put("budget", budget == null ? null : round2(budget.getAmount()));
        stats.put("budgetUsed", budget == null ? BigDecimal.ZERO
                : round2(expense.multiply(BigDecimal.valueOf(100))
                        .divide(budget.getAmount(), 4, RoundingMode.HALF_UP)));
        stats.put("categoryStats", categoryStats);

        cacheService.put(key, stats, cacheProperties.getTtlReportMonthly());
        return stats;
    }

    /**
     * 多月份收支趋势：从最早月份到当前月份
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> trend(String userId, int months) {
        String key = cacheService.reportTrendKey(userId) + ":" + months;
        List<Map<String, Object>> cached = cacheService.get(key, List.class);
        if (cached != null) {
            return cached;
        }

        YearMonth current = YearMonth.now();
        List<Map<String, Object>> trends = new ArrayList<>();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            String month = ym.format(MONTH_FORMAT);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.plusMonths(1).atDay(1);

            List<Bill> bills = billMapper.selectList(new LambdaQueryWrapper<Bill>()
                    .eq(Bill::getUserId, userId)
                    .ge(Bill::getDate, start)
                    .lt(Bill::getDate, end));

            BigDecimal expense = BigDecimal.ZERO;
            BigDecimal income = BigDecimal.ZERO;
            for (Bill bill : bills) {
                if ("income".equals(bill.getType())) {
                    income = income.add(bill.getAmount());
                } else {
                    expense = expense.add(bill.getAmount());
                }
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", month);
            item.put("expense", round2(expense));
            item.put("income", round2(income));
            trends.add(item);
        }

        cacheService.put(key, trends, cacheProperties.getTtlReportTrend());
        return trends;
    }

    private static BigDecimal round2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}

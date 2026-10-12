package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.entity.Budget;
import com.cloudledger.mapper.BudgetMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * 预算模块业务逻辑
 * - 设置/更新 upsert 语义
 * - 写操作后失效月度统计与预算执行缓存
 */
@Slf4j
@Service
public class BudgetService {

    @Autowired
    private BudgetMapper budgetMapper;

    @Autowired
    private CacheService cacheService;

    /**
     * 设置预算：该月已存在则更新金额，否则新建（与原系统 upsert 行为一致）
     */
    @Transactional(rollbackFor = Exception.class)
    public Budget upsert(String userId, String month, BigDecimal amount) {
        Budget budget = budgetMapper.selectOne(new LambdaQueryWrapper<Budget>()
                .eq(Budget::getUserId, userId)
                .eq(Budget::getMonth, month));
        if (budget == null) {
            budget = new Budget();
            budget.setBudgetId(UUID.randomUUID().toString());
            budget.setUserId(userId);
            budget.setMonth(month);
            budget.setAmount(amount);
            budgetMapper.insert(budget);
        } else {
            budget.setAmount(amount);
            budgetMapper.updateById(budget);
        }
        evictCaches(userId, month);
        return budget;
    }

    /**
     * 查询指定月份预算
     */
    public Budget getByUserAndMonth(String userId, String month) {
        return budgetMapper.selectOne(new LambdaQueryWrapper<Budget>()
                .eq(Budget::getUserId, userId)
                .eq(Budget::getMonth, month));
    }

    /**
     * 按 budget_id 更新金额
     */
    @Transactional(rollbackFor = Exception.class)
    public Budget updateAmount(String budgetId, BigDecimal amount) {
        Budget budget = budgetMapper.selectOne(
                new LambdaQueryWrapper<Budget>().eq(Budget::getBudgetId, budgetId));
        if (budget == null) {
            return null;
        }
        budget.setAmount(amount);
        budgetMapper.updateById(budget);
        evictCaches(budget.getUserId(), budget.getMonth());
        return budget;
    }

    private void evictCaches(String userId, String month) {
        cacheService.evict(
                cacheService.reportMonthlyKey(userId, month),
                cacheService.budgetExecKey(userId, month));
    }
}

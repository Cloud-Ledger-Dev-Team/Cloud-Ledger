package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.entity.Bill;
import com.cloudledger.mapper.BillMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 交易记录模块业务逻辑
 * - 与账单模块共用 bill 表（transaction_id 即 bill_id，account_id 为空）
 * - 不联动账户余额（与原系统行为一致）
 * - 写操作后失效报表与预算执行缓存
 */
@Slf4j
@Service
public class TransactionService {

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private CacheService cacheService;

    /**
     * 添加交易记录（无账户联动）
     */
    @Transactional(rollbackFor = Exception.class)
    public Bill create(String userId, BigDecimal amount, String type, String category,
                       LocalDate date, String description) {
        Bill bill = new Bill();
        bill.setBillId(UUID.randomUUID().toString());
        bill.setUserId(userId);
        bill.setAccountId(null);
        bill.setType(type);
        bill.setCategory(category);
        bill.setAmount(amount);
        bill.setDate(date);
        bill.setDescription(description == null ? "" : description);
        billMapper.insert(bill);
        evictCaches(userId);
        return bill;
    }

    /**
     * 查询用户全部交易记录，按日期倒序
     */
    public List<Bill> list(String userId) {
        return billMapper.selectList(new LambdaQueryWrapper<Bill>()
                .eq(Bill::getUserId, userId)
                .orderByDesc(Bill::getDate));
    }

    /**
     * 按字段更新交易记录（只更新请求体中包含的字段）
     */
    @Transactional(rollbackFor = Exception.class)
    public Bill update(String transactionId, BigDecimal amount, String type, String category,
                       String description, LocalDate date) {
        Bill bill = billMapper.selectOne(
                new LambdaQueryWrapper<Bill>().eq(Bill::getBillId, transactionId));
        if (bill == null) {
            return null;
        }
        if (amount != null) {
            bill.setAmount(amount);
        }
        if (type != null) {
            bill.setType(type);
        }
        if (category != null) {
            bill.setCategory(category);
        }
        if (description != null) {
            bill.setDescription(description);
        }
        if (date != null) {
            bill.setDate(date);
        }
        billMapper.updateById(bill);
        evictCaches(bill.getUserId());
        return bill;
    }

    /**
     * 删除交易记录（不回滚账户余额）
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean delete(String transactionId) {
        Bill bill = billMapper.selectOne(
                new LambdaQueryWrapper<Bill>().eq(Bill::getBillId, transactionId));
        if (bill == null) {
            return false;
        }
        billMapper.deleteById(bill.getId());
        evictCaches(bill.getUserId());
        return true;
    }

    private void evictCaches(String userId) {
        cacheService.evict(cacheService.reportTrendKey(userId));
        cacheService.evictByPattern(cacheService.reportMonthlyPrefix() + userId + ":*");
        cacheService.evictByPattern(cacheService.budgetExecPrefix() + userId + ":*");
    }
}

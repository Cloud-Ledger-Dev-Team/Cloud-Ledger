package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.common.exception.BusinessException;
import com.cloudledger.entity.Account;
import com.cloudledger.entity.Bill;
import com.cloudledger.mapper.AccountMapper;
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
 * 账单模块业务逻辑
 * - 增删改与账户余额联动（同一事务保证一致性）
 * - 写操作后失效：账户列表 / 月度统计 / 趋势 / 预算执行缓存
 */
@Slf4j
@Service
public class BillService {

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private AccountMapper accountMapper;

    @Autowired
    private CacheService cacheService;

    /**
     * 查询账单列表：按类型、起止日期筛选，日期倒序
     */
    public List<Bill> list(String userId, String type, LocalDate startDate, LocalDate endDate) {
        LambdaQueryWrapper<Bill> wrapper = new LambdaQueryWrapper<Bill>()
                .eq(Bill::getUserId, userId)
                .orderByDesc(Bill::getDate);
        if (type != null && !type.isBlank()) {
            wrapper.eq(Bill::getType, type);
        }
        if (startDate != null) {
            wrapper.ge(Bill::getDate, startDate);
        }
        if (endDate != null) {
            wrapper.le(Bill::getDate, endDate);
        }
        return billMapper.selectList(wrapper);
    }

    /**
     * 创建账单并联动账户余额（income +，expense -）
     */
    @Transactional(rollbackFor = Exception.class)
    public Bill create(String userId, String accountId, String type, String category,
                       BigDecimal amount, LocalDate date, String description) {
        Bill bill = new Bill();
        bill.setBillId(UUID.randomUUID().toString());
        bill.setUserId(userId);
        bill.setAccountId(accountId);
        bill.setType(type);
        bill.setCategory(category);
        bill.setAmount(amount);
        bill.setDate(date);
        bill.setDescription(description == null ? "" : description);
        billMapper.insert(bill);

        if (accountId != null) {
            Account account = accountMapper.selectOne(
                    new LambdaQueryWrapper<Account>().eq(Account::getAccountId, accountId));
            if (account != null) {
                account.setBalance(applyBill(account.getBalance(), amount, type));
                accountMapper.updateById(account);
            }
        }
        evictUserCaches(userId);
        return bill;
    }

    /**
     * 更新账单：先恢复原账户余额，更新字段后再应用新余额；支持跨账户迁移
     */
    @Transactional(rollbackFor = Exception.class)
    public Bill update(String billId, BigDecimal amount, String category, LocalDate date,
                       String description, String newAccountId) {
        Bill bill = billMapper.selectOne(
                new LambdaQueryWrapper<Bill>().eq(Bill::getBillId, billId));
        if (bill == null) {
            return null;
        }

        // 1. 恢复原账户余额（反冲原账单影响）
        Account originalAccount = bill.getAccountId() == null ? null
                : accountMapper.selectOne(
                        new LambdaQueryWrapper<Account>().eq(Account::getAccountId, bill.getAccountId()));
        if (originalAccount != null) {
            originalAccount.setBalance(revertBill(originalAccount.getBalance(), bill.getAmount(), bill.getType()));
        }

        // 2. 更新账单字段
        bill.setAmount(amount);
        bill.setCategory(category);
        bill.setDate(date);
        if (description != null) {
            bill.setDescription(description);
        }

        // 3. 账户迁移判定
        if (newAccountId != null && !newAccountId.isBlank() && !newAccountId.equals(bill.getAccountId())) {
            Account newAccount = accountMapper.selectOne(
                    new LambdaQueryWrapper<Account>().eq(Account::getAccountId, newAccountId));
            if (newAccount != null) {
                newAccount.setBalance(applyBill(newAccount.getBalance(), bill.getAmount(), bill.getType()));
            }
            bill.setAccountId(newAccountId);
        } else if (originalAccount != null) {
            originalAccount.setBalance(applyBill(originalAccount.getBalance(), bill.getAmount(), bill.getType()));
        }

        billMapper.updateById(bill);
        if (originalAccount != null) {
            accountMapper.updateById(originalAccount);
        }
        evictUserCaches(bill.getUserId());
        return bill;
    }

    /**
     * 删除账单并恢复账户余额（income 减，expense 加）
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean delete(String billId) {
        Bill bill = billMapper.selectOne(
                new LambdaQueryWrapper<Bill>().eq(Bill::getBillId, billId));
        if (bill == null) {
            return false;
        }
        if (bill.getAccountId() != null) {
            Account account = accountMapper.selectOne(
                    new LambdaQueryWrapper<Account>().eq(Account::getAccountId, bill.getAccountId()));
            if (account != null) {
                account.setBalance(revertBill(account.getBalance(), bill.getAmount(), bill.getType()));
                accountMapper.updateById(account);
            }
        }
        billMapper.deleteById(bill.getId());
        evictUserCaches(bill.getUserId());
        return true;
    }

    /**
     * 应用账单对余额的影响
     */
    private BigDecimal applyBill(BigDecimal balance, BigDecimal amount, String type) {
        return "income".equals(type) ? balance.add(amount) : balance.subtract(amount);
    }

    /**
     * 反冲账单对余额的影响（恢复）
     */
    private BigDecimal revertBill(BigDecimal balance, BigDecimal amount, String type) {
        return "income".equals(type) ? balance.subtract(amount) : balance.add(amount);
    }

    /**
     * 账单写操作后失效该用户相关缓存（账户列表 / 月度统计 / 趋势 / 预算执行）
     */
    private void evictUserCaches(String userId) {
        cacheService.evict(
                cacheService.accountListKey(userId),
                cacheService.reportTrendKey(userId));
        cacheService.evictByPattern(cacheService.reportMonthlyPrefix() + userId + ":*");
        cacheService.evictByPattern(cacheService.budgetExecPrefix() + userId + ":*");
    }
}

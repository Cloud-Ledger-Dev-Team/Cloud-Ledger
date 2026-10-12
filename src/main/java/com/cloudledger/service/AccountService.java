package com.cloudledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.cloudledger.common.cache.CacheService;
import com.cloudledger.entity.Account;
import com.fasterxml.jackson.core.type.TypeReference;
import com.cloudledger.entity.Bill;
import com.cloudledger.mapper.AccountMapper;
import com.cloudledger.mapper.BillMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * 账户模块业务逻辑
 * - 列表读取走 Redis 缓存（Cache Aside，TTL 10 min + 抖动）
 * - 写操作后主动失效缓存
 */
@Slf4j
@Service
public class AccountService {

    @Autowired
    private AccountMapper accountMapper;

    @Autowired
    private BillMapper billMapper;

    @Autowired
    private CacheService cacheService;

    /**
     * 查询用户全部账户（缓存优先）
     */
    public List<Account> listByUserId(String userId) {
        String key = cacheService.accountListKey(userId);
        List<Account> cached = cacheService.get(key, new TypeReference<List<Account>>() {});
        if (cached != null) {
            return cached;
        }
        List<Account> accounts = accountMapper.selectList(
                new LambdaQueryWrapper<Account>().eq(Account::getUserId, userId));
        cacheService.put(key, accounts, 600);
        return accounts;
    }

    /**
     * 创建账户
     */
    @Transactional(rollbackFor = Exception.class)
    public Account create(String userId, String name, String type, BigDecimal balance) {
        Account account = new Account();
        account.setAccountId(UUID.randomUUID().toString());
        account.setUserId(userId);
        account.setName(name);
        account.setType(type == null || type.isBlank() ? "现金" : type);
        account.setBalance(balance == null ? BigDecimal.ZERO : balance);
        accountMapper.insert(account);
        cacheService.evict(cacheService.accountListKey(userId));
        return account;
    }

    /**
     * 更新账户（只更新请求体中包含的字段）
     *
     * @return false 表示账户不存在
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean update(String accountId, String name, BigDecimal balance) {
        Account account = accountMapper.selectOne(
                new LambdaQueryWrapper<Account>().eq(Account::getAccountId, accountId));
        if (account == null) {
            return false;
        }
        if (name != null) {
            account.setName(name);
        }
        if (balance != null) {
            account.setBalance(balance);
        }
        accountMapper.updateById(account);
        cacheService.evict(cacheService.accountListKey(account.getUserId()));
        return true;
    }

    /**
     * 删除账户，级联删除其下所有账单（与原系统一致）
     *
     * @return false 表示账户不存在
     */
    @Transactional(rollbackFor = Exception.class)
    public boolean delete(String accountId) {
        Account account = accountMapper.selectOne(
                new LambdaQueryWrapper<Account>().eq(Account::getAccountId, accountId));
        if (account == null) {
            return false;
        }
        billMapper.delete(new LambdaQueryWrapper<Bill>().eq(Bill::getAccountId, accountId));
        accountMapper.deleteById(account.getId());
        cacheService.evict(cacheService.accountListKey(account.getUserId()));
        // 账单级联删除后，报表统计缓存一并失效
        cacheService.evictByPattern(cacheService.reportMonthlyPrefix() + account.getUserId() + ":*");
        cacheService.evict(cacheService.reportTrendKey(account.getUserId()));
        return true;
    }
}

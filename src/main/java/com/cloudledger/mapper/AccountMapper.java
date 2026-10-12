package com.cloudledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cloudledger.entity.Account;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;

@Mapper
public interface AccountMapper extends BaseMapper<Account> {

    /**
     * 原子更新余额（避免并发问题）
     */
    @Update("UPDATE account SET balance = balance + #{delta}, update_time = NOW() WHERE account_id = #{accountId}")
    int updateBalance(@Param("accountId") String accountId, @Param("delta") BigDecimal delta);
}

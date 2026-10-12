package com.cloudledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cloudledger.entity.Bill;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;

@Mapper
public interface BillMapper extends BaseMapper<Bill> {

    /**
     * 统计用户某月某分类（或全部分类）的支出总额
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM bill " +
            "WHERE user_id = #{userId} AND type = 'expense' " +
            "AND DATE_FORMAT(date, '%Y-%m') = #{month} " +
            "#{categorySql}")
    BigDecimal sumExpenseByMonth(@Param("userId") String userId,
                                 @Param("month") String month,
                                 @Param("categorySql") String categorySql);

    /**
     * 统计用户某月总收入
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM bill " +
            "WHERE user_id = #{userId} AND type = 'income' " +
            "AND DATE_FORMAT(date, '%Y-%m') = #{month}")
    BigDecimal sumIncomeByMonth(@Param("userId") String userId,
                                @Param("month") String month);
}

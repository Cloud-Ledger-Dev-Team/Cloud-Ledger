package com.cloudledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cloudledger.entity.Budget;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface BudgetMapper extends BaseMapper<Budget> {
}

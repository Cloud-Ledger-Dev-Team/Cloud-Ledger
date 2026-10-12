package com.cloudledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.cloudledger.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}

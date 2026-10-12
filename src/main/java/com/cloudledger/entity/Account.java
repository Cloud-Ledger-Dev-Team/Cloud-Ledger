package com.cloudledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 账户实体
 */
@Data
@TableName("account")
public class Account {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 业务主键（UUID v4）
     */
    private String accountId;

    /**
     * 所属用户 user_id
     */
    private String userId;

    /**
     * 账户名称
     */
    private String name;

    /**
     * 账户类型
     */
    private String type;

    /**
     * 余额
     */
    private BigDecimal balance;

    /**
     * 备注
     */
    private String description;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

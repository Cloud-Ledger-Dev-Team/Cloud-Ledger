package com.cloudledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 账单实体
 */
@Data
@TableName("bill")
public class Bill {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 业务主键（UUID v4）
     */
    private String billId;

    /**
     * 所属用户 user_id
     */
    private String userId;

    /**
     * 所属账户 account_id
     */
    private String accountId;

    /**
     * 收支类型：income / expense
     */
    private String type;

    /**
     * 分类
     */
    private String category;

    /**
     * 金额
     */
    private BigDecimal amount;

    /**
     * 账单日期
     */
    private LocalDate date;

    /**
     * 备注
     */
    private String description;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

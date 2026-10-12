package com.cloudledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 预算实体
 */
@Data
@TableName("budget")
public class Budget {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 业务主键（UUID v4）
     */
    private String budgetId;

    /**
     * 所属用户 user_id
     */
    private String userId;

    /**
     * 预算月份 YYYY-MM
     */
    private String month;

    /**
     * 分类（NULL 表示总预算）
     */
    private String category;

    /**
     * 预算金额
     */
    private BigDecimal amount;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

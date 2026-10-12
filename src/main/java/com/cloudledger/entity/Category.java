package com.cloudledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 分类实体
 * <p>
 * 分类分两类：
 * - 系统预设（user_id = NULL）：所有用户共享，不可删除；
 * - 用户自定义（user_id = 具体 UUID）：可增删改。
 * </p>
 */
@Data
@TableName("category")
public class Category {

    @TableId(type = IdType.AUTO)
    private Integer id;

    /**
     * 分类名称
     */
    private String name;

    /**
     * 收支类型：income / expense
     */
    private String type;

    /**
     * 所属用户 UUID（NULL = 系统预设）
     */
    private String userId;

    /**
     * 图标名称（Element Plus icons）
     */
    private String icon;

    /**
     * 图标/标签颜色（HEX，如 #409EFF）
     */
    private String color;

    /**
     * 同类型内排序序号，值越小越靠前
     */
    private Integer sortOrder;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

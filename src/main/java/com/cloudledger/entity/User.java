package com.cloudledger.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("user")
public class User {

    /**
     * 内部自增主键
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 业务主键（UUID v4）
     */
    private String userId;

    /**
     * 用户名
     */
    private String name;

    /**
     * 邮箱（唯一）
     */
    private String email;

    /**
     * bcrypt 哈希密码
     */
    private String password;

    /**
     * 微信 openid（微信登录用户非空，邮箱注册用户为 null）
     */
    private String openid;

    /**
     * 创建时间
     */
    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = com.baomidou.mybatisplus.annotation.FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

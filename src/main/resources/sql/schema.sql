-- ======================================================
-- Cloud-Ledger 云记账数据库初始化脚本（幂等版）
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- 说明：
--   1. 使用 CREATE TABLE IF NOT EXISTS + INSERT IGNORE，应用每次启动可安全重跑；
--   2. password 字段存储 bcrypt 哈希（$2a$ 开头，固定 60 字符）；
--   3. 交易记录模块与账单模块共用 bill 表（account_id 可空），
--      与原系统行为保持一致（见接口文档第九章）。
-- ======================================================

CREATE DATABASE IF NOT EXISTS `cloud_ledger`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cloud_ledger`;

-- ======================================================
-- 用户表
-- ======================================================
CREATE TABLE IF NOT EXISTS `user` (
    `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部）',
    `user_id`      VARCHAR(50)   NOT NULL                COMMENT 'UUID v4 业务主键',
    `name`         VARCHAR(100)  NOT NULL                COMMENT '用户名',
    `email`        VARCHAR(100)  NOT NULL                COMMENT '邮箱（唯一）',
    `password`     VARCHAR(60)   NOT NULL                COMMENT 'bcrypt 哈希（60 字符，$2a$ 开头）',
    `openid`       VARCHAR(64)   DEFAULT NULL            COMMENT '微信 openid（微信登录用户非空）',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    UNIQUE KEY `uk_email` (`email`),
    UNIQUE KEY `uk_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 兼容旧版 user 表（无 openid 列）：列已存在时 SQL 会失败，
-- 由 spring.sql.init.continue-on-error=true 忽略，整体幂等。
ALTER TABLE `user` ADD COLUMN `openid` VARCHAR(64) DEFAULT NULL COMMENT '微信 openid（微信登录用户非空）';
ALTER TABLE `user` ADD UNIQUE KEY `uk_openid` (`openid`);

-- ======================================================
-- 账户表
-- ======================================================
CREATE TABLE IF NOT EXISTS `account` (
    `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部）',
    `account_id`   VARCHAR(50)   NOT NULL                COMMENT 'UUID v4 业务主键',
    `user_id`      VARCHAR(50)   NOT NULL                COMMENT '所属用户 user_id',
    `name`         VARCHAR(100)  NOT NULL                COMMENT '账户名称（现金/工商银行/支付宝等）',
    `type`         VARCHAR(50)   NOT NULL                COMMENT '账户类型',
    `balance`      DECIMAL(18,2) NOT NULL DEFAULT 0.00   COMMENT '余额',
    `description`  VARCHAR(255)  DEFAULT NULL            COMMENT '备注',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_account_id` (`account_id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_account_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表';

-- ======================================================
-- 账单表
-- 注意：account_id 可空 —— 交易记录模块（/api/transactions）写入的流水
--       不关联账户、不联动余额，与原系统行为一致。
-- ======================================================
CREATE TABLE IF NOT EXISTS `bill` (
    `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部）',
    `bill_id`      VARCHAR(50)   NOT NULL                COMMENT 'UUID v4 业务主键',
    `user_id`      VARCHAR(50)   NOT NULL                COMMENT '所属用户 user_id',
    `account_id`   VARCHAR(50)   DEFAULT NULL            COMMENT '所属账户 account_id（流水类账单可空）',
    `type`         VARCHAR(20)   NOT NULL                COMMENT '收支类型：income / expense',
    `category`     VARCHAR(50)   NOT NULL                COMMENT '分类（餐饮/工资等）',
    `amount`       DECIMAL(18,2) NOT NULL                COMMENT '金额',
    `date`         DATE          NOT NULL                COMMENT '账单日期',
    `description`  VARCHAR(255)  DEFAULT NULL            COMMENT '备注',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_bill_id` (`bill_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_user_date` (`user_id`, `date`),
    CONSTRAINT `fk_bill_user`    FOREIGN KEY (`user_id`)    REFERENCES `user`    (`user_id`)    ON DELETE CASCADE,
    CONSTRAINT `fk_bill_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`) ON DELETE CASCADE,
    CONSTRAINT `ck_bill_amount`   CHECK (`amount` > 0),
    CONSTRAINT `ck_bill_type`     CHECK (`type` IN ('income', 'expense'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单表（含交易流水）';

-- ======================================================
-- 预算表
-- ======================================================
CREATE TABLE IF NOT EXISTS `budget` (
    `id`           BIGINT        NOT NULL AUTO_INCREMENT COMMENT '自增主键（内部）',
    `budget_id`    VARCHAR(50)   NOT NULL                COMMENT 'UUID v4 业务主键',
    `user_id`      VARCHAR(50)   NOT NULL                COMMENT '所属用户 user_id',
    `month`        VARCHAR(7)    NOT NULL                COMMENT '预算月份 YYYY-MM',
    `category`     VARCHAR(50)   DEFAULT NULL            COMMENT '分类（NULL 表示总预算）',
    `amount`       DECIMAL(18,2) NOT NULL                COMMENT '预算金额',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_budget_id` (`budget_id`),
    KEY `idx_user_month` (`user_id`, `month`),
    CONSTRAINT `fk_budget_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `ck_budget_amount` CHECK (`amount` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';

-- ======================================================
-- 反馈表
-- ======================================================
CREATE TABLE IF NOT EXISTS `feedback` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `user_id`     VARCHAR(50)  NOT NULL                COMMENT '提交者 user_id',
    `type`        VARCHAR(50)  DEFAULT NULL            COMMENT '类型：Bug / 建议',
    `content`     TEXT         NOT NULL                COMMENT '反馈内容',
    `contact`     VARCHAR(100) DEFAULT NULL            COMMENT '联系方式（可选）',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈表';

-- ======================================================
-- 分类表
-- ======================================================
CREATE TABLE IF NOT EXISTS `category` (
    `id`           INT          NOT NULL AUTO_INCREMENT COMMENT '自增主键',
    `name`         VARCHAR(50)  NOT NULL                COMMENT '分类名称',
    `type`         VARCHAR(20)  NOT NULL                COMMENT '收支类型：income / expense',
    `user_id`      VARCHAR(36)  DEFAULT NULL             COMMENT '所属用户 UUID（NULL=系统预设）',
    `icon`         VARCHAR(50)  DEFAULT 'Grid'           COMMENT '图标名称（Element Plus icon）',
    `color`        VARCHAR(20)  DEFAULT '#409EFF'        COMMENT '图标/标签颜色（HEX）',
    `sort_order`   INT          NOT NULL DEFAULT 0       COMMENT '同类型内排序，值越小越靠前',
    `create_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP       COMMENT '创建时间',
    `update_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_name_type` (`user_id`, `name`, `type`),
    CONSTRAINT `ck_category_type` CHECK (`type` IN ('income', 'expense'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 兼容旧版表结构（无 user_id/icon/color/sort_order 列）：列已存在时 ALTER TABLE 会跳过；
-- 唯一键冲突时抛错但 continue-on-error=true 会继续执行后续语句。
ALTER TABLE `category` ADD COLUMN IF NOT EXISTS `user_id`    VARCHAR(36)  NULL        COMMENT '所属用户（NULL=系统预设）' AFTER `type`;
ALTER TABLE `category` ADD COLUMN IF NOT EXISTS `icon`       VARCHAR(50)  DEFAULT 'Grid'     COMMENT '图标名称';
ALTER TABLE `category` ADD COLUMN IF NOT EXISTS `color`      VARCHAR(20)  DEFAULT '#409EFF'  COMMENT '图标/标签颜色';
ALTER TABLE `category` ADD COLUMN IF NOT EXISTS `sort_order` INT          NOT NULL DEFAULT 0 COMMENT '排序序号';

-- ======================================================
-- 初始数据：预设分类（系统内置，幂等写入）
-- ------------------------------------------------------
-- 注意：预设分类 user_id 为 NULL，而 MySQL 唯一索引中 NULL 之间
-- 互不相等，uk_user_name_type 无法约束预设行，INSERT IGNORE 每次
-- 启动都会重复插入；改用 WHERE NOT EXISTS 判断实现真正幂等。
-- ======================================================
INSERT INTO `category` (`name`, `type`)
SELECT v.`name`, v.`type`
FROM (
    SELECT '工资' AS `name`, 'income' AS `type` UNION ALL
    SELECT '奖金', 'income' UNION ALL
    SELECT '投资收益', 'income' UNION ALL
    SELECT '兼职收入', 'income' UNION ALL
    SELECT '礼金', 'income' UNION ALL
    SELECT '其他收入', 'income' UNION ALL
    SELECT '餐饮', 'expense' UNION ALL
    SELECT '交通', 'expense' UNION ALL
    SELECT '购物', 'expense' UNION ALL
    SELECT '娱乐', 'expense' UNION ALL
    SELECT '医疗', 'expense' UNION ALL
    SELECT '教育', 'expense' UNION ALL
    SELECT '房租', 'expense' UNION ALL
    SELECT '水电煤气', 'expense' UNION ALL
    SELECT '通讯费', 'expense' UNION ALL
    SELECT '生活费', 'expense' UNION ALL
    SELECT '其他支出', 'expense'
) v
WHERE NOT EXISTS (
    SELECT 1 FROM `category` c
    WHERE c.`user_id` IS NULL AND c.`name` = v.`name` AND c.`type` = v.`type`
);

-- 给系统预设分类回填 icon / color / sort_order（user_id IS NULL 区分预设与自定义）
UPDATE `category` SET `icon`='Grid', `color`='#409EFF', `sort_order`=`id` WHERE `user_id` IS NULL;

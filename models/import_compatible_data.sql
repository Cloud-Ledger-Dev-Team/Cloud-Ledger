-- Cloud Ledger SQLite 兼容的插入脚本
-- 基于 sql.sql 转换，确保与当前 ORM 模型字段完全对应

BEGIN TRANSACTION;

-- 清空旧数据（按外键依赖顺序）
DELETE FROM bill;
DELETE FROM budget;
DELETE FROM account;
DELETE FROM user;

-- ======================================================
-- 用户数据 (对应 User 模型)
-- ======================================================
-- 注意：ORM 中使用字符串类型的 user_id 而非自增整数
INSERT INTO user (user_id, name, email, password)
VALUES 
    ('user001', '张三', 'zhangsan@example.com', 'password123'),
    ('user002', '李四', 'lisi@example.com', 'password456'),
    ('user003', '王五', 'wangwu@example.com', 'password789');

-- ======================================================
-- 账户数据 (对应 Account 模型)
-- ======================================================
INSERT INTO account (account_id, user_id, name, type, balance)
VALUES 
    ('acc001', 'user001', '现金', '现金', 1000.00),
    ('acc002', 'user001', '工商银行储蓄卡', '银行卡', 5000.00),
    ('acc003', 'user002', '微信钱包', '电子账户', 2000.00),
    ('acc004', 'user003', '支付宝', '电子账户', 3000.00),
    ('acc005', 'user003', '建设银行信用卡', '信用卡', 0.00);

-- ======================================================
-- 账单数据 (对应 Bill 模型)
-- ======================================================
-- 注意：ORM 中 type 字段使用 'income'/'expense'，这里保持中文以匹配原始数据
INSERT INTO bill (bill_id, user_id, account_id, type, category, amount, date, description)
VALUES 
    ('bill001', 'user001', 'acc001', '支出', '餐饮', 50.00, '2023-10-01', '午餐'),
    ('bill002', 'user001', 'acc002', '收入', '工资', 5000.00, '2023-10-05', '10月份工资'),
    ('bill003', 'user002', 'acc003', '支出', '交通', 100.00, '2023-10-02', '地铁充值'),
    ('bill004', 'user003', 'acc004', '支出', '购物', 200.00, '2023-10-03', '日用品'),
    ('bill005', 'user001', 'acc001', '支出', '餐饮', 150.00, '2023-10-04', '晚餐'),
    ('bill006', 'user003', 'acc004', '收入', '奖金', 1000.00, '2023-10-06', '项目奖金');

-- ======================================================
-- 预算数据 (对应 Budget 模型)
-- ======================================================
-- 注意：ORM 中使用 month 字段 (YYYY-MM 格式) 而非 start_date/end_date
INSERT INTO budget (budget_id, user_id, month, amount)
VALUES 
    ('budget001', 'user001', '2023-10', 1000.00),  -- 餐饮预算
    ('budget002', 'user001', '2023-10', 500.00),   -- 交通预算
    ('budget003', 'user002', '2023-10', 2000.00);  -- 购物预算

COMMIT;

-- ======================================================
-- 验证查询语句（SQLite 兼容）
-- ======================================================
-- 1. 查询所有用户
SELECT user_id, name, email FROM user;

-- 2. 查询所有账户
SELECT account_id, user_id, name, type, balance FROM account;

-- 3. 查询所有账单
SELECT bill_id, user_id, account_id, type, category, amount, date, description FROM bill;

-- 4. 查询所有预算
SELECT budget_id, user_id, month, amount FROM budget;
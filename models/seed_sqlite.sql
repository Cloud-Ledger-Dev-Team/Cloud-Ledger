-- Cloud Ledger SQLite 种子数据脚本
-- 运行前请确保已连接到 models/cloud_ledger.db

BEGIN TRANSACTION;

-- 清空旧数据（注意外键顺序）
DELETE FROM bill;
DELETE FROM budget;
DELETE FROM account;
DELETE FROM user;

-- 用户
INSERT INTO user (user_id, name, email, password)
VALUES
    ('user001', '张三', 'zhangsan@example.com', 'password123'),
    ('user002', '李四', 'lisi@example.com', 'password456'),
    ('user003', '王五', 'wangwu@example.com', 'password789');

-- 账户
INSERT INTO account (account_id, user_id, name, type, balance)
VALUES
    ('acc001', 'user001', '现金', 'cash', 1000.00),
    ('acc002', 'user001', '工商银行储蓄卡', 'bank', 5000.00),
    ('acc003', 'user002', '微信钱包', 'e_wallet', 2000.00),
    ('acc004', 'user003', '支付宝', 'e_wallet', 3000.00),
    ('acc005', 'user003', '建设银行信用卡', 'credit_card', 0.00);

-- 账单
INSERT INTO bill (bill_id, user_id, account_id, type, category, amount, date, description)
VALUES
    ('bill001', 'user001', 'acc001', 'expense', '餐饮', 50.00, '2023-10-01', '午餐'),
    ('bill002', 'user001', 'acc002', 'income', '工资', 5000.00, '2023-10-05', '10月份工资'),
    ('bill003', 'user002', 'acc003', 'expense', '交通', 100.00, '2023-10-02', '地铁充值'),
    ('bill004', 'user003', 'acc004', 'expense', '购物', 200.00, '2023-10-03', '日用品'),
    ('bill005', 'user001', 'acc001', 'expense', '餐饮', 150.00, '2023-10-04', '晚餐'),
    ('bill006', 'user003', 'acc004', 'income', '奖金', 1000.00, '2023-10-06', '项目奖金');

-- 预算
INSERT INTO budget (budget_id, user_id, month, amount)
VALUES
    ('budget001', 'user001', '2023-10', 1000.00),
    ('budget002', 'user001', '2023-10', 500.00),
    ('budget003', 'user002', '2023-10', 2000.00);

COMMIT;


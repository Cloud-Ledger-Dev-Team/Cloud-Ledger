-- ======================================================
-- Cloud Ledger 数据库脚本 (SQL Server)
-- 根据架构图创建数据库、表结构、约束、测试数据及查询语句
-- ======================================================

-- 创建数据库
CREATE DATABASE CloudLedger;
GO

-- 使用创建的数据库
USE CloudLedger;
GO

-- 创建用户表
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),  -- 用户ID，主键，自增
    Username NVARCHAR(50) NOT NULL UNIQUE, -- 用户名，唯一约束
    Email NVARCHAR(100) NOT NULL UNIQUE,   -- 邮箱，唯一约束
    PasswordHash NVARCHAR(255) NOT NULL,   -- 密码哈希
);
GO

-- 创建账户表
CREATE TABLE Accounts (
    AccountID INT PRIMARY KEY IDENTITY(1,1), -- 账户ID，主键，自增
    UserID INT NOT NULL,                     -- 用户ID，外键
    AccountName NVARCHAR(50) NOT NULL,       -- 账户名称
    AccountType NVARCHAR(20) NOT NULL,       -- 账户类型（现金、银行卡等）
    Balance DECIMAL(18, 2) DEFAULT 0.00,     -- 账户余额
    CreateTime DATETIME DEFAULT GETDATE(),   -- 创建时间
    
    -- 外键约束，关联用户表
    CONSTRAINT FK_Accounts_Users FOREIGN KEY (UserID) 
        REFERENCES Users(UserID) 
        ON DELETE CASCADE  -- 删除用户时，级联删除其账户
);
GO

-- 创建账单表
CREATE TABLE Bills (
    BillID INT PRIMARY KEY IDENTITY(1,1),   -- 账单ID，主键，自增
    UserID INT NOT NULL,                     -- 用户ID，外键
    AccountID INT NOT NULL,                  -- 账户ID，外键
    Amount DECIMAL(18, 2) NOT NULL,          -- 金额
    Type NVARCHAR(10) NOT NULL,              -- 类型（收入/支出）
    Category NVARCHAR(50) NOT NULL,          -- 分类（餐饮、工资等）
    BillDate DATE NOT NULL,                  -- 账单日期
    Description NVARCHAR(255),               -- 备注
    CreateTime DATETIME DEFAULT GETDATE(),   -- 创建时间
    
    -- 检查约束，确保金额大于0
    CONSTRAINT CK_Bills_Amount CHECK (Amount > 0),
    -- 检查约束，确保类型只能是收入或支出
    CONSTRAINT CK_Bills_Type CHECK (Type IN ('收入', '支出')),
    -- 外键约束，关联用户表
    CONSTRAINT FK_Bills_Users FOREIGN KEY (UserID) 
        REFERENCES Users(UserID) 
        ON DELETE CASCADE,
    -- 外键约束，关联账户表
    CONSTRAINT FK_Bills_Accounts FOREIGN KEY (AccountID) 
        REFERENCES Accounts(AccountID) 
        ON DELETE NO ACTION
);
GO

-- 创建预算表
CREATE TABLE Budgets (
    BudgetID INT PRIMARY KEY IDENTITY(1,1),  -- 预算ID，主键，自增
    UserID INT NOT NULL,                     -- 用户ID，外键
    Category NVARCHAR(50) NOT NULL,          -- 预算分类
    Amount DECIMAL(18, 2) NOT NULL,          -- 预算金额
    SpentAmount DECIMAL(18, 2) DEFAULT 0.00, -- 已花费金额
    StartDate DATE NOT NULL,                 -- 开始日期
    EndDate DATE NOT NULL,                   -- 结束日期
    CreateTime DATETIME DEFAULT GETDATE(),   -- 创建时间
    
    -- 检查约束，确保预算金额大于0
    CONSTRAINT CK_Budgets_Amount CHECK (Amount > 0),
    -- 检查约束，确保结束日期晚于开始日期
    CONSTRAINT CK_Budgets_Dates CHECK (EndDate > StartDate),
    -- 外键约束，关联用户表
    CONSTRAINT FK_Budgets_Users FOREIGN KEY (UserID) 
        REFERENCES Users(UserID) 
        ON DELETE CASCADE
);
GO

-- 创建分类表
CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1), -- 分类ID，主键，自增
    CategoryName NVARCHAR(50) NOT NULL,       -- 分类名称
    Type NVARCHAR(10) NOT NULL,               -- 类型（收入/支出）
    
    -- 唯一约束，确保同一类型下分类名称不重复
    CONSTRAINT UQ_CategoryName_Type UNIQUE (CategoryName, Type),
    -- 检查约束，确保类型只能是收入或支出
    CONSTRAINT CK_Categories_Type CHECK (Type IN ('收入', '支出'))
);
GO

-- ======================================================
-- 插入测试数据
-- ======================================================

-- 插入用户数据
INSERT INTO Users (Username, Email, PasswordHash)
VALUES 
    ('张三', 'zhangsan@example.com', 'password123_hash'),
    ('李四', 'lisi@example.com', 'password456_hash'),
    ('王五', 'wangwu@example.com', 'password789_hash');
GO

-- 插入账户数据
INSERT INTO Accounts (UserID, AccountName, AccountType, Balance)
VALUES 
    (1, '现金', '现金', 1000.00),
    (1, '工商银行储蓄卡', '银行卡', 5000.00),
    (2, '微信钱包', '电子账户', 2000.00),
    (3, '支付宝', '电子账户', 3000.00),
    (3, '建设银行信用卡', '信用卡', 0.00);
GO

-- 插入分类数据
INSERT INTO Categories (CategoryName, Type)
VALUES 
    ('餐饮', '支出'),
    ('交通', '支出'),
    ('购物', '支出'),
    ('工资', '收入'),
    ('奖金', '收入'),
    ('投资收益', '收入');
GO

-- 插入账单数据（至少5条）
INSERT INTO Bills (UserID, AccountID, Amount, Type, Category, BillDate, Description)
VALUES 
    (1, 1, 50.00, '支出', '餐饮', '2023-10-01', '午餐'),
    (1, 2, 5000.00, '收入', '工资', '2023-10-05', '10月份工资'),
    (2, 3, 100.00, '支出', '交通', '2023-10-02', '地铁充值'),
    (3, 4, 200.00, '支出', '购物', '2023-10-03', '日用品'),
    (1, 1, 150.00, '支出', '餐饮', '2023-10-04', '晚餐'),
    (3, 4, 1000.00, '收入', '奖金', '2023-10-06', '项目奖金');
GO

-- 插入预算数据
INSERT INTO Budgets (UserID, Category, Amount, StartDate, EndDate)
VALUES 
    (1, '餐饮', 1000.00, '2023-10-01', '2023-10-31'),
    (1, '交通', 500.00, '2023-10-01', '2023-10-31'),
    (2, '购物', 2000.00, '2023-10-01', '2023-10-31');
GO

-- ======================================================
-- SQL查询语句（验证表关系）
-- ======================================================

-- 1. 查询所有用户及其账户信息
SELECT 
    u.UserID, u.Username, u.Email,
    a.AccountID, a.AccountName, a.AccountType, a.Balance
FROM dbo.Users u
LEFT JOIN dbo.Accounts a ON u.UserID = a.UserID
ORDER BY u.UserID, a.AccountID;
GO

-- 2. 查询指定用户的所有账单信息
SELECT 
    b.BillID, b.Amount, b.Type, b.Category,
    b.BillDate, b.Description,
    a.AccountName, u.Username
FROM dbo.Bills b
INNER JOIN dbo.Accounts a ON b.AccountID = a.AccountID
INNER JOIN dbo.Users u ON b.UserID = u.UserID
WHERE u.UserID = 1 -- 查询用户ID为1的所有账单
ORDER BY b.BillDate DESC;
GO

-- 3. 统计每个用户的收入和支出总额
SELECT 
    u.UserID, u.Username,
    SUM(CASE WHEN b.Type = '收入' THEN b.Amount ELSE 0 END) AS TotalIncome,
    SUM(CASE WHEN b.Type = '支出' THEN b.Amount ELSE 0 END) AS TotalExpense,
    (SUM(CASE WHEN b.Type = '收入' THEN b.Amount ELSE 0 END) - 
     SUM(CASE WHEN b.Type = '支出' THEN b.Amount ELSE 0 END)) AS NetBalance
FROM dbo.Users u
LEFT JOIN dbo.Bills b ON u.UserID = b.UserID
GROUP BY u.UserID, u.Username
ORDER BY u.UserID;
GO

-- 4. 查询预算执行情况
SELECT 
    b.BudgetId, b.Category, b.Amount AS BudgetAmount,
    ISNULL(SUM(bi.Amount), 0) AS SpentAmount,
    (b.Amount - ISNULL(SUM(bi.Amount), 0)) AS RemainingAmount,
    u.Username
FROM dbo.Budgets b
LEFT JOIN dbo.Users u ON b.UserID = u.UserID
LEFT JOIN dbo.Bills bi ON b.UserID = bi.UserID 
    AND b.Category = bi.Category 
    AND bi.BillDate BETWEEN b.StartDate AND b.EndDate
    AND bi.Type = '支出'
GROUP BY b.BudgetId, b.Category, b.Amount, u.Username
ORDER BY b.BudgetId;
GO

-- 5. 查询各分类的支出统计
SELECT 
    c.CategoryName, 
    SUM(b.Amount) AS TotalAmount,
    COUNT(b.BillID) AS BillCount
FROM dbo.Categories c
LEFT JOIN dbo.Bills b ON c.CategoryName = b.Category AND c.Type = '支出'
WHERE c.Type = '支出'
GROUP BY c.CategoryName
ORDER BY TotalAmount DESC;
GO
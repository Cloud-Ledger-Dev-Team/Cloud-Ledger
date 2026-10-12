import os
import sqlite3
import uuid
from datetime import datetime

# 数据库文件路径
db_path = 'c:/Users/Zanna/Cloud-Ledger-1/models/cloud_ledger.db'

# 如果数据库文件存在，先删除它
if os.path.exists(db_path):
    print(f"删除现有数据库文件: {db_path}")
    os.remove(db_path)

# 创建新的数据库连接
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 创建用户表
print("创建用户表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS user (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
)
''')

# 创建账户表
print("创建账户表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS account (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    account_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance FLOAT DEFAULT 0.0,
    FOREIGN KEY(user_id) REFERENCES user(user_id)
)
''')

# 创建账单表
print("创建账单表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS bill (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    bill_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount FLOAT NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255),
    FOREIGN KEY(user_id) REFERENCES user(user_id),
    FOREIGN KEY(account_id) REFERENCES account(account_id)
)
''')

# 创建预算表
print("创建预算表...")
cursor.execute('''
CREATE TABLE IF NOT EXISTS budget (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    budget_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    month VARCHAR(7) NOT NULL,
    amount FLOAT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES user(user_id)
)
''')

# 插入一些测试数据
print("插入测试数据...")

# 插入用户
user1_id = str(uuid.uuid4())
cursor.execute('''
INSERT INTO user (user_id, name, email, password)
VALUES (?, ?, ?, ?)
''', (user1_id, '演示用户', 'demo@example.com', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'))

# 插入账户
account1_id = str(uuid.uuid4())
cursor.execute('''
INSERT INTO account (account_id, user_id, name, type, balance)
VALUES (?, ?, ?, ?, ?)
''', (account1_id, user1_id, '现金账户', '现金', 1000.0))

account2_id = str(uuid.uuid4())
cursor.execute('''
INSERT INTO account (account_id, user_id, name, type, balance)
VALUES (?, ?, ?, ?, ?)
''', (account2_id, user1_id, '银行卡', '银行卡', 5000.0))

# 插入账单
today = datetime.now().strftime('%Y-%m-%d')
for i in range(5):
    bill_id = str(uuid.uuid4())
    cursor.execute('''
    INSERT INTO bill (bill_id, user_id, account_id, type, category, amount, date, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (bill_id, user1_id, account1_id, 'expense' if i % 2 == 0 else 'income', 
          '餐饮' if i % 2 == 0 else '工资', 100.0 + i * 20, today, f'测试账单 {i+1}'))

# 插入预算
budget_id = str(uuid.uuid4())
current_month = datetime.now().strftime('%Y-%m')
cursor.execute('''
INSERT INTO budget (budget_id, user_id, month, amount)
VALUES (?, ?, ?, ?)
''', (budget_id, user1_id, current_month, 3000.0))

# 提交事务
conn.commit()
print("数据库创建成功！")

# 验证数据库
try:
    print("\n验证数据库内容:")
    # 检查用户表
    cursor.execute("SELECT COUNT(*) FROM user")
    user_count = cursor.fetchone()[0]
    print(f"用户表记录数: {user_count}")
    
    # 检查账户表
    cursor.execute("SELECT COUNT(*) FROM account")
    account_count = cursor.fetchone()[0]
    print(f"账户表记录数: {account_count}")
    
    # 检查账单表
    cursor.execute("SELECT COUNT(*) FROM bill")
    bill_count = cursor.fetchone()[0]
    print(f"账单表记录数: {bill_count}")
    
    # 检查预算表
    cursor.execute("SELECT COUNT(*) FROM budget")
    budget_count = cursor.fetchone()[0]
    print(f"预算表记录数: {budget_count}")
    
    print("\n数据库验证成功！")
    
except Exception as e:
    print(f"数据库验证失败: {e}")

# 关闭连接
conn.close()
print(f"\n数据库已成功创建并保存在: {db_path}")
print("现在可以使用SQLite工具打开此数据库文件。")
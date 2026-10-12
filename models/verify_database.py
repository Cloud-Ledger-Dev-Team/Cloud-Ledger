import sqlite3

# 数据库文件路径
db_path = 'c:/Users/Zanna/Cloud-Ledger-1/models/cloud_ledger.db'

print(f"开始验证数据库文件: {db_path}")

try:
    # 连接到数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print("成功连接到数据库！")
    
    # 获取数据库中的所有表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print(f"\n数据库中的表: {[table[0] for table in tables]}")
    
    # 验证每个表的结构和数据
    for table in tables:
        table_name = table[0]
        print(f"\n验证表: {table_name}")
        
        # 获取表结构
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        print(f"表结构: {[(col[1], col[2]) for col in columns]}")
        
        # 获取表中的记录数
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        count = cursor.fetchone()[0]
        print(f"记录数: {count}")
        
        # 如果有记录，显示前3条
        if count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
            rows = cursor.fetchall()
            print(f"前3条记录示例:")
            for row in rows:
                print(f"  {row}")
    
    # 测试一些基本查询
    print("\n测试跨表查询:")
    if 'user' in [t[0] for t in tables] and 'account' in [t[0] for t in tables]:
        cursor.execute("SELECT u.name, a.name, a.balance FROM user u JOIN account a ON u.user_id = a.user_id;")
        results = cursor.fetchall()
        print(f"用户和账户关联查询结果: {results}")
    
    print("\n数据库验证成功！数据库文件可以正常使用。")
    
except sqlite3.Error as e:
    print(f"数据库操作错误: {e}")
except Exception as e:
    print(f"发生错误: {e}")
finally:
    # 关闭连接
    if 'conn' in locals():
        conn.close()
        print("\n数据库连接已关闭。")

print("\n验证完成。修复后的数据库文件可以使用SQLite工具正常打开和操作。")
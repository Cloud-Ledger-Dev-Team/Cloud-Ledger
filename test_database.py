import sqlite3

try:
    # 连接数据库
    print("尝试连接数据库...")
    conn = sqlite3.connect('models/cloud_ledger.db')
    cursor = conn.cursor()
    print("✅ 数据库连接成功!")
    
    # 列出所有表
    print("\n查询所有数据库表:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    if tables:
        print("✅ 成功获取表列表:")
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("⚠️  未找到任何表")
    
    # 检查每个表的结构
    print("\n检查表结构:")
    for table in tables:
        table_name = table[0]
        print(f"\n📋 表 '{table_name}' 的结构:")
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]}){' [PRIMARY KEY]' if col[5] else ''}")
    
    # 测试插入和查询操作
    print("\n测试数据库操作...")
    # 由于这是新数据库，我们不实际插入数据，只验证操作权限
    cursor.execute("SELECT COUNT(*) FROM user")
    user_count = cursor.fetchone()[0]
    print(f"✅ 用户表当前记录数: {user_count}")
    
    print("\n🎉 数据库验证成功！数据库可以正常打开和使用。")
    
    # 关闭连接
    conn.close()
    
except sqlite3.Error as e:
    print(f"❌ 数据库操作失败: {e}")
except Exception as e:
    print(f"❌ 发生未知错误: {e}")
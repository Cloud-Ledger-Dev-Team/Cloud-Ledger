# init_db_fix.py
from controllers.app import app
from models.database_models import db
import os

# 确保在应用上下文中运行
with app.app_context():
    # 1. 确保数据库目录存在
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    folder = os.path.dirname(db_path)
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"创建目录: {folder}")

    # 2. 创建所有表
    print("正在创建数据库表...")
    db.create_all()
    print("数据库表创建成功！")
    print(f"数据库文件位置: {db_path}")
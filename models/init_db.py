# models/init_db.py
import os
import sys
from flask import Flask

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 直接从database_models导入db
from models.database_models import db

# 创建一个简单的Flask应用用于数据库初始化
app = Flask(__name__)
# 配置SQLite数据库 - 使用绝对路径
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///d:/HuaweiMoveData/Users/Zanna/Desktop/Cloud-Ledger-1/models/cloud_ledger.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 初始化数据库
def init_database():
    # 绑定app到db
    db.init_app(app)
    with app.app_context():
        # 创建所有表
        db.create_all()
        print('数据库表已成功创建！')

if __name__ == '__main__':
    init_database()
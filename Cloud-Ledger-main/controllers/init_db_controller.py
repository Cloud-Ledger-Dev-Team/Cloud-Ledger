# controllers/init_db_controller.py
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from controllers.models_controller import db
from controllers.main import app

# 初始化数据库
def init_database():
    with app.app_context():
        # 创建所有表
        db.create_all()
        print('数据库表已成功创建！')

if __name__ == '__main__':
    init_database()
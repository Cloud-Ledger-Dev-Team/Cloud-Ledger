from flask import Flask, render_template
from flask_cors import CORS
import os

# 创建Flask应用实例
app = Flask(__name__, template_folder='../views', static_folder='../views')

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../models/cloud_ledger.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 启用CORS
CORS(app)

# 从models导入数据库实例
from models.database_models import db

# 初始化数据库
db.init_app(app)

# 通用工具函数
def hash_password(password):
    """加密密码函数"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

# 初始化数据库命令
@app.cli.command('init-db')
def init_db():
    with app.app_context():
        db.create_all()
        print('数据库已初始化')

# 导入并注册蓝图
from controllers.user_controller import user_bp
from controllers.account_controller import account_bp
from controllers.bill_controller import bill_bp
from controllers.budget_controller import budget_bp
from controllers.category_controller import category_bp
from controllers.report_controller import report_bp
from controllers.transaction_controller import transaction_bp

# 注册蓝图
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(account_bp, url_prefix='/api/accounts')
app.register_blueprint(bill_bp, url_prefix='/api/bills')
app.register_blueprint(budget_bp, url_prefix='/api/budgets')
app.register_blueprint(category_bp, url_prefix='/api/categories')
app.register_blueprint(report_bp, url_prefix='/api/analytics')
app.register_blueprint(transaction_bp, url_prefix='/api/transactions')

# 主页路由
@app.route('/')
def index():
    return render_template('index.html')

# 运行入口
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

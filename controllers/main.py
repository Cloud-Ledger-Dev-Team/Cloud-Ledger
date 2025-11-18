# controllers/main.py
from flask import Flask, render_template
from flask_cors import CORS
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 创建Flask应用实例
app = Flask(__name__, template_folder='../views', static_folder='../views')

# 配置数据库
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models', 'cloud_ledger.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 启用CORS
CORS(app)

# 从models导入数据库实例
from models.database_models import db

# 初始化数据库
db.init_app(app)

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

# 视图路由
@app.route('/')
def index():
    return render_template('cloud_ledger.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# 404错误处理
@app.errorhandler(404)
def page_not_found(e):
    return render_template('cloud_ledger.html'), 404

if __name__ == '__main__':
    # 运行应用
    app.run(debug=True, host='0.0.0.0', port=5000)
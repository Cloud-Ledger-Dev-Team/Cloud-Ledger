# controllers/main.py
from flask import Flask, request, jsonify, render_template
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入控制器
from controllers.user_controller import UserController
from controllers.account_controller import AccountController
from controllers.bill_controller import BillController
from controllers.budget_controller import BudgetController
from controllers.category_controller import CategoryController
from controllers.report_controller import ReportController
# 导入数据库模型
from controllers.models_controller import db

# 初始化Flask应用
app = Flask(__name__, template_folder='../views', static_folder='../views')

# 配置数据库
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cloud_ledger.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 初始化数据库
db.init_app(app)

# 初始化控制器实例
user_controller = UserController()
account_controller = AccountController()
bill_controller = BillController()
budget_controller = BudgetController()
category_controller = CategoryController()
report_controller = ReportController()

# API路由配置

# 用户相关路由
@app.route('/api/register', methods=['POST'])
def register():
    return user_controller.register()

@app.route('/api/login', methods=['POST'])
def login():
    return user_controller.login()

# 账户相关路由
@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    user_id = request.args.get('user_id')
    return account_controller.get_all_accounts(user_id)

@app.route('/api/accounts', methods=['POST'])
def add_account():
    return account_controller.add_account()

@app.route('/api/accounts/<account_id>', methods=['PUT'])
def update_account(account_id):
    return account_controller.update_account(account_id)

@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def delete_account(account_id):
    return account_controller.delete_account(account_id)

# 账单相关路由
@app.route('/api/bills', methods=['GET'])
def get_bills():
    user_id = request.args.get('user_id')
    return bill_controller.get_bills(user_id)

@app.route('/api/bills', methods=['POST'])
def add_bill():
    return bill_controller.add_bill()

@app.route('/api/bills/<bill_id>', methods=['PUT'])
def update_bill(bill_id):
    return bill_controller.update_bill(bill_id)

@app.route('/api/bills/<bill_id>', methods=['DELETE'])
def delete_bill(bill_id):
    return bill_controller.delete_bill(bill_id)

# 预算相关路由
@app.route('/api/budgets', methods=['POST'])
def set_budget():
    return budget_controller.set_budget()

@app.route('/api/budgets/<user_id>/<month>', methods=['GET'])
def get_budget(user_id, month):
    return budget_controller.get_budget(user_id, month)

@app.route('/api/budgets/<budget_id>', methods=['PUT'])
def update_budget(budget_id):
    return budget_controller.update_budget(budget_id)

# 分类相关路由
@app.route('/api/categories', methods=['GET'])
def get_categories():
    return category_controller.get_categories()

# 数据分析相关路由
@app.route('/api/analytics/monthly/<user_id>/<month>', methods=['GET'])
def get_monthly_analytics(user_id, month):
    return report_controller.get_monthly_analytics(user_id, month)

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

@app.route('/api/analytics/trend/<user_id>', methods=['GET'])
def get_trend_analytics(user_id):
    return report_controller.get_trend_analytics(user_id)

# 页面路由
@app.route('/')
def home():
    return render_template('cloud_ledger.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    app.run(debug=True)
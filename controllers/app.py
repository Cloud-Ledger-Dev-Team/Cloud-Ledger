# controllers/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from models.database_models import db

# 1. 导入所有业务模块的蓝图 (之前漏掉了这些，导致登录后无法记账)
from controllers.user_controller import user_bp
from controllers.account_controller import account_bp
from controllers.bill_controller import bill_bp
from controllers.budget_controller import budget_bp
from controllers.category_controller import category_bp
from controllers.report_controller import report_bp
from controllers.transaction_controller import transaction_bp

app = Flask(__name__, template_folder='../views', static_folder='../views')

# 2. 数据库与应用配置
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(base_dir, 'models', 'cloud_ledger.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key' # 生产环境请修改此密钥

# 3. 【正规修正】使用 flask-cors 标准配置替代手动 after_request
# 只允许前端 http://127.0.0.1:5500 访问，且允许带 Cookie/Token
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# 4. 初始化插件
jwt = JWTManager(app)
db.init_app(app)

# 5. 【重要修正】注册所有蓝图，恢复完整功能
# 只有注册了这些，前端的记账、统计页面才能获取到数据
app.register_blueprint(user_bp, url_prefix='/api')              # 登录注册
app.register_blueprint(account_bp, url_prefix='/api/accounts')  # 账户管理
app.register_blueprint(bill_bp, url_prefix='/api/bills')        # 账单管理
app.register_blueprint(budget_bp, url_prefix='/api/budgets')    # 预算管理
app.register_blueprint(category_bp, url_prefix='/api/categories') # 分类管理
app.register_blueprint(report_bp, url_prefix='/api/analytics')  # 数据报表
app.register_blueprint(transaction_bp, url_prefix='/api/transactions') # 交易记录

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "success", "message": "Cloud Ledger API 服务已完全启动"})
# controllers/app.py
from flask import Flask, jsonify, request, make_response
from flask_jwt_extended import JWTManager
import os
from models.database_models import db

# 导入业务蓝图
from controllers.user_controller import user_bp
from controllers.account_controller import account_bp
from controllers.bill_controller import bill_bp
from controllers.budget_controller import budget_bp
from controllers.category_controller import category_bp
from controllers.report_controller import report_bp
from controllers.transaction_controller import transaction_bp

app = Flask(__name__, template_folder='../views', static_folder='../views')

# 数据库配置
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.path.join(base_dir, 'models', 'cloud_ledger.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

# 初始化插件
jwt = JWTManager(app)
db.init_app(app)

# 注册蓝图
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(account_bp, url_prefix='/api/accounts')
app.register_blueprint(bill_bp, url_prefix='/api/bills')
app.register_blueprint(budget_bp, url_prefix='/api/budgets')
app.register_blueprint(category_bp, url_prefix='/api/categories')
app.register_blueprint(report_bp, url_prefix='/api/analytics')
app.register_blueprint(transaction_bp, url_prefix='/api/transactions')

# ==========================================
# 【终极修正】CORS 动态镜像配置
# ==========================================

# 1. 拦截 OPTIONS 请求，直接返回成功
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        # 动态获取请求来源
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
        
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

# 2. 拦截所有响应，动态添加头
@app.after_request
def add_cors_headers(response):
    # 动态获取请求来源，浏览器发什么，我们回什么，保证 100% 匹配
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
    
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# ==========================================

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "success", "message": "Backend is ready"})
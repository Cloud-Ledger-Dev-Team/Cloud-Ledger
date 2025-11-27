from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

# 创建Flask应用实例
app = Flask(__name__, template_folder='../views', static_folder='../views')

# 初始化JWTManager
jwt = JWTManager(app)

# 配置数据库
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../models/cloud_ledger.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# 启用CORS，使用更宽松的配置以确保前端可以正常访问
CORS(app, origins=['*'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['*'], supports_credentials=True)

# 蓝图将在main.py中注册

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

# 蓝图将在main.py中注册

# 主页路由
@app.route('/')
def index():
    return "Cloud Ledger API is running"

# 测试端点
@app.route('/api/test', methods=['GET', 'POST'])
def test_endpoint():
    return jsonify({'success': True, 'message': '测试端点正常工作'})

# 直接在app.py中定义注册路由
import uuid
from models.database_models import User, Account
from flask_jwt_extended import create_access_token

@app.route('/api/register', methods=['POST'])
def register():
    """用户注册接口"""
    data = request.json
    
    # 检查邮箱是否已存在
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'success': False, 'error': '该邮箱已被注册'})
    
    # 创建新用户
    new_user = User(
        user_id=str(uuid.uuid4()),
        name=data['name'],
        email=data['email'],
        password=hash_password(data['password'])
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # 创建默认账户
    default_account = Account(
        account_id=str(uuid.uuid4()),
        user_id=new_user.user_id,
        name='默认账户',
        type='现金',
        balance=0.0
    )
    
    db.session.add(default_account)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': {
            'user_id': new_user.user_id,
            'name': new_user.name,
            'email': new_user.email
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    """用户登录接口"""
    data = request.json
    
    # 查找用户
    user = User.query.filter_by(email=data['email']).first()
    
    # 验证用户和密码
    if not user or user.password != hash_password(data['password']):
        return jsonify({'success': False, 'error': '邮箱或密码错误'}), 401
    
    # 创建访问令牌
    access_token = create_access_token(identity=user.user_id)
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'user': {
            'user_id': user.user_id,
            'name': user.name,
            'email': user.email
        }
    })

# 运行入口
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# controllers/user_controller.py
from flask import request, jsonify, Blueprint
import hashlib
import uuid
from models.database_models import db, User, Account

# 创建用户蓝图
user_bp = Blueprint('user_bp', __name__)

# 工具函数
def hash_password(password):
    """加密密码函数"""
    return hashlib.sha256(password.encode()).hexdigest()

@user_bp.route('/register', methods=['POST'])
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

@user_bp.route('/login', methods=['POST'])
def login():
    """用户登录接口"""
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    if user and user.password == hash_password(data['password']):
        return jsonify({
            'success': True,
            'user': {
                'user_id': user.user_id,
                'name': user.name,
                'email': user.email
            }
        })
    else:
        return jsonify({'success': False, 'error': '邮箱或密码错误'})

@user_bp.route('/logout', methods=['POST'])
def logout():
    """用户注销接口"""
    # 注销登录（例如清理session）
    return jsonify({"message": "用户已注销"})
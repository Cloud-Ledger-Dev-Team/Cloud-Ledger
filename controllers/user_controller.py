# controllers/user_controller.py
from flask import Blueprint, request, jsonify
from models.database_models import db, User, Account
# 【修正】引入 JWT 生成工具
from flask_jwt_extended import create_access_token
import uuid
import hashlib

user_bp = Blueprint('user_bp', __name__)

def hash_password(password):
    # 生产建议：实际项目中建议加 Salt (盐) 防止彩虹表破解
    # 这里暂且保持 SHA256，但流程是规范的
    return hashlib.sha256(password.encode()).hexdigest()

@user_bp.route('/login', methods=['POST'], strict_slashes=False)
def login():
    try:
        data = request.json
        # 1. 查找用户
        user = User.query.filter_by(email=data['email']).first()

        # 2. 校验密码
        if not user or user.password != hash_password(data['password']):
            return jsonify({'success': False, 'error': '邮箱或密码错误'}), 401

        # 3. 【正规做法】生成真实的 JWT Token
        # identity 内存放用户的唯一标识 (user_id)
        # 这个 token 包含签名，前端篡改不了，且默认有过期时间
        access_token = create_access_token(identity=user.user_id)

        # 4. 返回真实数据
        return jsonify({
            'success': True,
            'token': access_token,  # 这里现在是真实的 JWT 字符串
            'access_token': access_token, # 兼容不同前端写法
            'user': {
                'user_id': user.user_id,
                'name': user.name,
                'email': user.email
            }
        })
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({'success': False, 'error': '服务器内部错误'}), 500

@user_bp.route('/register', methods=['POST'], strict_slashes=False)
def register():
    try:
        data = request.json
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': '该邮箱已被注册'}), 400

        new_user = User(
            user_id=str(uuid.uuid4()),
            name=data['name'],
            email=data['email'],
            password=hash_password(data['password'])
        )
        db.session.add(new_user)
        
        # 创建默认账户
        db.session.add(Account(
            account_id=str(uuid.uuid4()),
            user_id=new_user.user_id,
            name='默认账户',
            type='现金',
            balance=0.0
        ))
        
        db.session.commit()
        return jsonify({'success': True, 'user': {'user_id': new_user.user_id}})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
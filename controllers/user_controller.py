# controllers/user_controller.py
from flask import request, jsonify
import hashlib
import uuid
from controllers.models_controller import db, User, Account

class UserController:
    """处理用户注册、登录、注销等逻辑"""

    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode()).hexdigest()

    def register(self):
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
            password=self.hash_password(data['password'])
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

    def login(self):
        data = request.json
        
        user = User.query.filter_by(email=data['email']).first()
        if user and user.password == self.hash_password(data['password']):
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

    def logout(self):
        # 注销登录（例如清理session）
        return jsonify({"message": "用户已注销"})
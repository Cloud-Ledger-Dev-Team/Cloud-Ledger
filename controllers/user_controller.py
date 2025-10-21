# controllers/user_controller.py
from flask import request, jsonify
from models.user_model import User

class UserController:
    """处理用户注册、登录、注销等逻辑"""

    def register(self):
        data = request.get_json()
        # 调用模型创建用户
        result = User.create_user(data)
        return jsonify(result)

    def login(self):
        data = request.get_json()
        result = User.verify_login(data)
        return jsonify(result)

    def logout(self):
        # 注销登录（例如清理session）
        return jsonify({"message": "用户已注销"})
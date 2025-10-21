# controllers/account_controller.py
from flask import request, jsonify
from models.account_model import Account

class AccountController:
    """处理账户/资产相关功能"""

    def get_all_accounts(self, user_id):
        accounts = Account.get_by_user(user_id)
        return jsonify(accounts)

    def add_account(self):
        data = request.get_json()
        result = Account.create(data)
        return jsonify(result)

    def update_account(self, account_id):
        data = request.get_json()
        result = Account.update(account_id, data)
        return jsonify(result)

    def delete_account(self, account_id):
        result = Account.delete(account_id)
        return jsonify(result)
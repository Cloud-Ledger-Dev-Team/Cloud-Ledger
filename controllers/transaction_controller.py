# controllers/transaction_controller.py
from flask import request, jsonify
from models.transaction_model import Transaction

class TransactionController:
    """处理记账收支记录"""

    def add_transaction(self):
        data = request.get_json()
        result = Transaction.create(data)
        return jsonify(result)

    def get_transactions(self, user_id):
        transactions = Transaction.get_by_user(user_id)
        return jsonify(transactions)

    def delete_transaction(self, transaction_id):
        result = Transaction.delete(transaction_id)
        return jsonify(result)
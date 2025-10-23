# controllers/transaction_controller.py
from flask import request, jsonify
from controllers.bill_controller import BillController

class TransactionController:
    """处理收支记录功能（账单功能的包装器）"""
    
    def __init__(self):
        # 复用BillController的功能
        self.bill_controller = BillController()

    def add_transaction(self):
        # 调用BillController的add_bill方法
        return self.bill_controller.add_bill()

    def get_transactions(self):
        # 调用BillController的get_bills方法
        user_id = request.args.get('user_id')
        return self.bill_controller.get_bills(user_id)
    
    def update_transaction(self, transaction_id):
        # 调用BillController的update_bill方法
        return self.bill_controller.update_bill(transaction_id)
    
    def delete_transaction(self, transaction_id):
        # 调用BillController的delete_bill方法
        return self.bill_controller.delete_bill(transaction_id)
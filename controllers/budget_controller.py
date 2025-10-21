# controllers/budget_controller.py
from flask import request, jsonify
from models.budget_model import Budget

class BudgetController:
    """预算控制、超支提醒"""

    def set_budget(self):
        data = request.get_json()
        result = Budget.set_budget(data)
        return jsonify(result)

    def get_budget_status(self, user_id):
        status = Budget.check_status(user_id)
        return jsonify(status)
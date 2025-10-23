# controllers/budget_controller.py
from flask import request, jsonify
import uuid
from controllers.models_controller import db, Budget

class BudgetController:
    """处理预算相关功能"""

    def set_budget(self):
        data = request.json
        user_id = data['user_id']
        month = data['month']
        amount = data['amount']
        
        # 检查是否已存在该月的预算
        existing_budget = Budget.query.filter_by(user_id=user_id, month=month).first()
        
        if existing_budget:
            # 更新现有预算
            existing_budget.amount = amount
            db.session.commit()
            return jsonify({
                'success': True,
                'budget': {
                    'budget_id': existing_budget.budget_id,
                    'user_id': existing_budget.user_id,
                    'month': existing_budget.month,
                    'amount': existing_budget.amount
                }
            })
        else:
            # 创建新预算
            new_budget = Budget(
                budget_id=str(uuid.uuid4()),
                user_id=user_id,
                month=month,
                amount=amount
            )
            db.session.add(new_budget)
            db.session.commit()
            return jsonify({
                'success': True,
                'budget': {
                    'budget_id': new_budget.budget_id,
                    'user_id': new_budget.user_id,
                    'month': new_budget.month,
                    'amount': new_budget.amount
                }
            })

    def get_budget(self, user_id, month):
        budget = Budget.query.filter_by(user_id=user_id, month=month).first()
        
        if budget:
            return jsonify({
                'success': True,
                'budget': {
                    'budget_id': budget.budget_id,
                    'user_id': budget.user_id,
                    'month': budget.month,
                    'amount': budget.amount
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': '该月暂无预算设置'
            })
    
    def update_budget(self, budget_id):
        data = request.json
        
        budget = Budget.query.filter_by(budget_id=budget_id).first()
        if not budget:
            return jsonify({'success': False, 'error': '预算不存在'})
        
        if 'amount' in data:
            budget.amount = data['amount']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'budget': {
                'budget_id': budget.budget_id,
                'user_id': budget.user_id,
                'month': budget.month,
                'amount': budget.amount
            }
        })
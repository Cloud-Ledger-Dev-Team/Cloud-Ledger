# controllers/account_controller.py
from flask import request, jsonify, Blueprint
import uuid
from models.database_models import db, Account, Bill

# 创建账户蓝图
account_bp = Blueprint('account_bp', __name__)

@account_bp.route('/<user_id>', methods=['GET'])
def get_all_accounts(user_id):
    """获取用户所有账户"""
    accounts = Account.query.filter_by(user_id=user_id).all()
    return jsonify({
        'success': True,
        'accounts': [{
            'account_id': account.account_id,
            'name': account.name,
            'type': account.type,
            'balance': account.balance
        } for account in accounts]
    })

@account_bp.route('/', methods=['POST'])
def add_account():
    """添加新账户"""
    data = request.json
    
    new_account = Account(
        account_id=str(uuid.uuid4()),
        user_id=data['user_id'],
        name=data['name'],
        type=data['type'],
        balance=data.get('balance', 0.0)
    )
    
    db.session.add(new_account)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'account': {
            'account_id': new_account.account_id,
            'name': new_account.name,
            'type': new_account.type,
            'balance': new_account.balance
        }
    })

@account_bp.route('/<account_id>', methods=['PUT'])
def update_account(account_id):
    """更新账户信息"""
    data = request.json
    
    account = Account.query.filter_by(account_id=account_id).first()
    if not account:
        return jsonify({'success': False, 'error': '账户不存在'})
    
    if 'name' in data:
        account.name = data['name']
    if 'type' in data:
        account.type = data['type']
    if 'balance' in data:
        account.balance = data['balance']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'account': {
            'account_id': account.account_id,
            'name': account.name,
            'type': account.type,
            'balance': account.balance
        }
    })

@account_bp.route('/<account_id>', methods=['DELETE'])
def delete_account(account_id):
    """删除账户"""
    account = Account.query.filter_by(account_id=account_id).first()
    if not account:
        return jsonify({'success': False, 'error': '账户不存在'})
    
    # 检查是否有相关的账单
    bills_count = Bill.query.filter_by(account_id=account_id).count()
    if bills_count > 0:
        return jsonify({'success': False, 'error': '该账户有相关账单，无法删除'})
    
    db.session.delete(account)
    db.session.commit()
    
    return jsonify({'success': True})
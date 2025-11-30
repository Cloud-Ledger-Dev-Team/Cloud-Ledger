# controllers/account_controller.py
from flask import request, jsonify, Blueprint
import uuid
from models.database_models import db, Account, Bill

# 【修复】增加 strict_slashes=False，允许不带斜杠访问
account_bp = Blueprint('account_bp', __name__)

# 获取列表 (GET /api/accounts?user_id=xxx)
# 注意：前端现在是用 query 参数传 user_id，而不是路径参数
@account_bp.route('', methods=['GET'], strict_slashes=False) 
def get_all_accounts():
    user_id = request.args.get('user_id') # 从 ?user_id=... 获取
    if not user_id:
        # 尝试从路径参数兼容旧逻辑（如果需要）
        return jsonify({'success': False, 'error': '缺少 user_id 参数'})

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

# 添加 (POST /api/accounts)
@account_bp.route('', methods=['POST'], strict_slashes=False)
def add_account():
    data = request.json
    new_account = Account(
        account_id=str(uuid.uuid4()),
        user_id=data['user_id'],
        name=data['name'],
        type=data.get('type', '现金'),
        balance=data.get('balance', 0.0)
    )
    db.session.add(new_account)
    db.session.commit()
    return jsonify({'success': True, 'account': {'account_id': new_account.account_id}})

# 更新 (PUT /api/accounts/<id>)
@account_bp.route('/<account_id>', methods=['PUT'], strict_slashes=False)
def update_account(account_id):
    data = request.json
    account = Account.query.filter_by(account_id=account_id).first()
    if not account: return jsonify({'success': False, 'error': '账户不存在'})
    
    if 'name' in data: account.name = data['name']
    if 'balance' in data: account.balance = data['balance']
    
    db.session.commit()
    return jsonify({'success': True})

# 删除 (DELETE /api/accounts/<id>)
@account_bp.route('/<account_id>', methods=['DELETE'], strict_slashes=False)
def delete_account(account_id):
    account = Account.query.filter_by(account_id=account_id).first()
    if not account: return jsonify({'success': False, 'error': '账户不存在'})
    
    # 级联删除相关账单（可选，防止报错）
    Bill.query.filter_by(account_id=account_id).delete()
    
    db.session.delete(account)
    db.session.commit()
    return jsonify({'success': True})
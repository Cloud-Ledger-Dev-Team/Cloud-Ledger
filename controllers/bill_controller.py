# controllers/bill_controller.py
from flask import request, jsonify, Blueprint
from datetime import datetime
import uuid
from models.database_models import db, Bill, Account

bill_bp = Blueprint('bill_bp', __name__)

# 获取账单 (GET /api/bills)
# 前端传参是 ?user_id=...
@bill_bp.route('', methods=['GET'], strict_slashes=False)
def get_bills():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': '缺少 user_id'})

    query = Bill.query.filter_by(user_id=user_id)
    # ... (保留筛选逻辑，如果需要) ...
    
    bills = query.order_by(Bill.date.desc()).all()
    
    return jsonify({
        'success': True,
        'bills': [{
            'bill_id': bill.bill_id,
            'type': bill.type,
            'category': bill.category,
            'amount': bill.amount,
            'date': bill.date.strftime('%Y-%m-%d'),
            'description': bill.description
        } for bill in bills]
    })

# 添加账单 (POST /api/bills)
@bill_bp.route('', methods=['POST'], strict_slashes=False)
def add_bill():
    data = request.json
    
    # 1. 记一笔
    new_bill = Bill(
        bill_id=str(uuid.uuid4()),
        user_id=data['user_id'],
        account_id=data['account_id'],
        type=data['type'],
        category=data['category'],
        amount=data['amount'],
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        description=data.get('description', '')
    )
    
    # 2. 更新账户余额
    account = Account.query.filter_by(account_id=data['account_id']).first()
    if account:
        if data['type'] == 'income':
            account.balance += data['amount']
        else:
            account.balance -= data['amount']
    
    db.session.add(new_bill)
    db.session.commit()
    
    return jsonify({'success': True})
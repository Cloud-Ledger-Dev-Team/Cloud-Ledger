# controllers/bill_controller.py
from flask import request, jsonify, Blueprint
from datetime import datetime
import uuid
from models.database_models import db, Bill, Account

bill_bp = Blueprint('bill_bp', __name__)

# 获取账单 (GET /api/bills)
# 前端传参是 ?user_id=...&type=...&startDate=...&endDate=...
@bill_bp.route('', methods=['GET'], strict_slashes=False)
def get_bills():
    user_id = request.args.get('user_id')
    bill_type = request.args.get('type')      # income / expense
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')

    if not user_id:
        return jsonify({'success': False, 'error': '缺少 user_id'})

    query = Bill.query.filter(Bill.user_id == user_id)

    # ✅ 类型筛选
    if bill_type and bill_type != '':
        query = query.filter(Bill.type == bill_type)

    # ✅ 开始日期
    if start_date:
        query = query.filter(Bill.date >= start_date)

    # ✅ 结束日期
    if end_date:
        query = query.filter(Bill.date <= end_date)

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

# 更新账单 (PUT /api/bills/<bill_id>)
@bill_bp.route('/<bill_id>', methods=['PUT'], strict_slashes=False)
def update_bill(bill_id):
    data = request.json
    
    # 1. 查找账单
    bill = Bill.query.filter_by(bill_id=bill_id).first()
    if not bill:
        return jsonify({'success': False, 'error': '账单不存在'})
    
    # 2. 先恢复原账户的余额
    account = Account.query.filter_by(account_id=bill.account_id).first()
    if account:
        if bill.type == 'income':
            account.balance -= bill.amount
        else:
            account.balance += bill.amount
    
    # 3. 更新账单信息
    old_account_id = bill.account_id
    bill.amount = data['amount']
    bill.category = data['category']
    bill.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    bill.description = data.get('description', '')
    
    # 4. 如果账户改变了，需要更新新账户的余额
    if 'account_id' in data and data['account_id'] != old_account_id:
        # 更新新账户
        new_account = Account.query.filter_by(account_id=data['account_id']).first()
        if new_account:
            if bill.type == 'income':
                new_account.balance += bill.amount
            else:
                new_account.balance -= bill.amount
        bill.account_id = data['account_id']
    else:
        # 更新原账户
        if account:
            if bill.type == 'income':
                account.balance += bill.amount
            else:
                account.balance -= bill.amount
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '账单更新成功',
        'bill': {
            'bill_id': bill.bill_id,
            'user_id': bill.user_id,
            'type': bill.type,
            'category': bill.category,
            'amount': bill.amount,
            'date': bill.date.strftime('%Y-%m-%d'),
            'description': bill.description
        }
    })

# 删除账单 (DELETE /api/bills/<bill_id>)
@bill_bp.route('/<bill_id>', methods=['DELETE'], strict_slashes=False)
def delete_bill(bill_id):
    # 1. 查找账单
    bill = Bill.query.filter_by(bill_id=bill_id).first()
    if not bill:
        return jsonify({'success': False, 'error': '账单不存在'})
    
    # 2. 恢复账户余额
    account = Account.query.filter_by(account_id=bill.account_id).first()
    if account:
        if bill.type == 'income':
            account.balance -= bill.amount
        else:
            account.balance += bill.amount
    
    # 3. 删除账单
    db.session.delete(bill)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '账单删除成功'
    })
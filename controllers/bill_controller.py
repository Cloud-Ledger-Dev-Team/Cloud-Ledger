# controllers/bill_controller.py
from flask import request, jsonify, Blueprint
from datetime import datetime
import uuid
from models.database_models import db, Bill, Account

# 创建账单蓝图
bill_bp = Blueprint('bill_bp', __name__)

@bill_bp.route('/user/<user_id>', methods=['GET'])
def get_bills(user_id):
    """获取用户账单列表，支持筛选"""
    # 获取查询参数
    type_filter = request.args.get('type')
    category_filter = request.args.get('category')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    query = Bill.query.filter_by(user_id=user_id)
    
    if type_filter:
        query = query.filter_by(type=type_filter)
    if category_filter:
        query = query.filter_by(category=category_filter)
    if start_date:
        query = query.filter(Bill.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Bill.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
    
    bills = query.order_by(Bill.date.desc()).all()
    
    return jsonify({
        'success': True,
        'bills': [{
            'bill_id': bill.bill_id,
            'account_id': bill.account_id,
            'type': bill.type,
            'category': bill.category,
            'amount': bill.amount,
            'date': bill.date.strftime('%Y-%m-%d'),
            'description': bill.description
        } for bill in bills]
    })

@bill_bp.route('/', methods=['POST'])
def add_bill():
    """添加新账单"""
    data = request.json
    
    # 创建新账单
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
    
    # 更新账户余额
    account = Account.query.filter_by(account_id=data['account_id']).first()
    if not account:
        return jsonify({'success': False, 'error': '账户不存在'})
    
    if data['type'] == 'income':
        account.balance += data['amount']
    else:
        account.balance -= data['amount']
    
    db.session.add(new_bill)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'bill': {
            'bill_id': new_bill.bill_id,
            'account_id': new_bill.account_id,
            'type': new_bill.type,
            'category': new_bill.category,
            'amount': new_bill.amount,
            'date': new_bill.date.strftime('%Y-%m-%d'),
            'description': new_bill.description
        }
    })

@bill_bp.route('/<bill_id>', methods=['PUT'])
def update_bill(bill_id):
    """更新账单信息"""
    data = request.json
    
    bill = Bill.query.filter_by(bill_id=bill_id).first()
    if not bill:
        return jsonify({'success': False, 'error': '账单不存在'})
    
    # 恢复原账户余额
    original_account = Account.query.filter_by(account_id=bill.account_id).first()
    if original_account:
        if bill.type == 'income':
            original_account.balance -= bill.amount
        else:
            original_account.balance += bill.amount
    
    # 更新账单信息
    if 'account_id' in data:
        bill.account_id = data['account_id']
    if 'type' in data:
        bill.type = data['type']
    if 'category' in data:
        bill.category = data['category']
    if 'amount' in data:
        bill.amount = data['amount']
    if 'date' in data:
        bill.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'description' in data:
        bill.description = data['description']
    
    # 更新新账户余额
    new_account = Account.query.filter_by(account_id=bill.account_id).first()
    if new_account:
        if bill.type == 'income':
            new_account.balance += bill.amount
        else:
            new_account.balance -= bill.amount
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'bill': {
            'bill_id': bill.bill_id,
            'account_id': bill.account_id,
            'type': bill.type,
            'category': bill.category,
            'amount': bill.amount,
            'date': bill.date.strftime('%Y-%m-%d'),
            'description': bill.description
        }
    })

@bill_bp.route('/<bill_id>', methods=['DELETE'])
def delete_bill(bill_id):
    """删除账单"""
    bill = Bill.query.filter_by(bill_id=bill_id).first()
    if not bill:
        return jsonify({'success': False, 'error': '账单不存在'})
    
    # 恢复账户余额
    account = Account.query.filter_by(account_id=bill.account_id).first()
    if account:
        if bill.type == 'income':
            account.balance -= bill.amount
        else:
            account.balance += bill.amount
    
    db.session.delete(bill)
    db.session.commit()
    
    return jsonify({'success': True})
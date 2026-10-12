# controllers/transaction_controller.py
from flask import request, jsonify, Blueprint
from models.database_models import db, Bill
import uuid
from datetime import datetime

# 创建交易蓝图
transaction_bp = Blueprint('transaction_bp', __name__)

@transaction_bp.route('/', methods=['POST'], strict_slashes=False)
def add_transaction():
    """添加收支记录"""
    data = request.json
    
    # 创建新的交易记录
    new_bill = Bill(
        bill_id=str(uuid.uuid4()),
        user_id=data['user_id'],
        amount=data['amount'],
        type=data['type'],
        category=data['category'],
        description=data.get('description', ''),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date()
    )
    
    # 添加到数据库
    db.session.add(new_bill)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '交易记录添加成功',
        'transaction': {
            'transaction_id': new_bill.bill_id,
            'user_id': new_bill.user_id,
            'amount': new_bill.amount,
            'type': new_bill.type,
            'category': new_bill.category,
            'description': new_bill.description,
            'date': new_bill.date.strftime('%Y-%m-%d')
        }
    })

@transaction_bp.route('/', methods=['GET'], strict_slashes=False)
def get_transactions():
    """获取收支记录列表"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': '缺少用户ID参数'})
    
    # 查询该用户的所有交易记录
    bills = Bill.query.filter_by(user_id=user_id).order_by(Bill.date.desc()).all()
    
    # 转换为前端需要的格式
    transactions = [
        {
            'transaction_id': bill.bill_id,
            'user_id': bill.user_id,
            'amount': bill.amount,
            'type': bill.type,
            'category': bill.category,
            'description': bill.description,
            'date': bill.date.strftime('%Y-%m-%d')
        } for bill in bills
    ]
    
    return jsonify({
        'success': True,
        'transactions': transactions
    })

@transaction_bp.route('/<transaction_id>', methods=['PUT'], strict_slashes=False)
def update_transaction(transaction_id):
    """更新收支记录"""
    data = request.json
    
    # 查找交易记录
    bill = Bill.query.filter_by(bill_id=transaction_id).first()
    
    if not bill:
        return jsonify({'success': False, 'error': '交易记录不存在'})
    
    # 更新字段
    if 'amount' in data:
        bill.amount = data['amount']
    if 'type' in data:
        bill.type = data['type']
    if 'category' in data:
        bill.category = data['category']
    if 'description' in data:
        bill.description = data['description']
    if 'date' in data:
        bill.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '交易记录更新成功',
        'transaction': {
            'transaction_id': bill.bill_id,
            'user_id': bill.user_id,
            'amount': bill.amount,
            'type': bill.type,
            'category': bill.category,
            'description': bill.description,
            'date': bill.date.strftime('%Y-%m-%d')
        }
    })

@transaction_bp.route('/<transaction_id>', methods=['DELETE'], strict_slashes=False)
def delete_transaction(transaction_id):
    """删除收支记录"""
    # 查找交易记录
    bill = Bill.query.filter_by(bill_id=transaction_id).first()
    
    if not bill:
        return jsonify({'success': False, 'error': '交易记录不存在'})
    
    # 从数据库删除
    db.session.delete(bill)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '交易记录删除成功'
    })
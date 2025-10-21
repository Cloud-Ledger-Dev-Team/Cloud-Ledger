from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import hashlib
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cloud_ledger.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

CORS(app)
db = SQLAlchemy(app)

# 数据库模型定义
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    bills = db.relationship('Bill', backref='user', lazy=True)
    budgets = db.relationship('Budget', backref='user', lazy=True)
    accounts = db.relationship('Account', backref='user', lazy=True)

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('user.user_id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 现金、银行卡、支付宝等
    balance = db.Column(db.Float, default=0.0)

class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('user.user_id'), nullable=False)
    account_id = db.Column(db.String(50), db.ForeignKey('account.account_id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # income 或 expense
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255))

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey('user.user_id'), nullable=False)
    month = db.Column(db.String(7), nullable=False)  # YYYY-MM 格式
    amount = db.Column(db.Float, nullable=False)

# 辅助函数：加密密码
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# API 路由：用户模块
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    # 检查邮箱是否已存在
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'success': False, 'error': '该邮箱已被注册'})
    
    # 创建新用户
    new_user = User(
        user_id=str(uuid.uuid4()),
        name=data['name'],
        email=data['email'],
        password=hash_password(data['password'])
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # 创建默认账户
    default_account = Account(
        account_id=str(uuid.uuid4()),
        user_id=new_user.user_id,
        name='默认账户',
        type='现金',
        balance=0.0
    )
    
    db.session.add(default_account)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': {
            'user_id': new_user.user_id,
            'name': new_user.name,
            'email': new_user.email
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    if user and user.password == hash_password(data['password']):
        return jsonify({
            'success': True,
            'user': {
                'user_id': user.user_id,
                'name': user.name,
                'email': user.email
            }
        })
    else:
        return jsonify({'success': False, 'error': '邮箱或密码错误'})

# API 路由：账户模块
@app.route('/api/accounts/<user_id>', methods=['GET'])
def get_accounts(user_id):
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

@app.route('/api/accounts', methods=['POST'])
def add_account():
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

@app.route('/api/accounts/<account_id>', methods=['PUT'])
def update_account(account_id):
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

@app.route('/api/accounts/<account_id>', methods=['DELETE'])
def delete_account(account_id):
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

# API 路由：账单模块
@app.route('/api/bills/<user_id>', methods=['GET'])
def get_bills(user_id):
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

@app.route('/api/bills', methods=['POST'])
def add_bill():
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

@app.route('/api/bills/<bill_id>', methods=['PUT'])
def update_bill(bill_id):
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

@app.route('/api/bills/<bill_id>', methods=['DELETE'])
def delete_bill(bill_id):
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

# API 路由：数据分析模块
@app.route('/api/stats/monthly/<user_id>/<month>', methods=['GET'])
def get_monthly_stats(user_id, month):
    # 解析年月
    year, month_num = map(int, month.split('-'))
    
    # 计算月份的开始和结束日期
    start_date = datetime(year, month_num, 1).date()
    if month_num == 12:
        end_date = datetime(year + 1, 1, 1).date()
    else:
        end_date = datetime(year, month_num + 1, 1).date()
    
    # 获取当月所有账单
    bills = Bill.query.filter(
        Bill.user_id == user_id,
        Bill.date >= start_date,
        Bill.date < end_date
    ).all()
    
    # 计算总收入和总支出
    income = sum(bill.amount for bill in bills if bill.type == 'income')
    expense = sum(bill.amount for bill in bills if bill.type == 'expense')
    balance = income - expense
    
    # 获取预算信息
    budget = Budget.query.filter_by(user_id=user_id, month=month).first()
    
    # 按分类统计支出
    category_stats = {}
    for bill in bills:
        if bill.type == 'expense':
            if bill.category not in category_stats:
                category_stats[bill.category] = 0
            category_stats[bill.category] += bill.amount
    
    return jsonify({
        'success': True,
        'stats': {
            'month': month,
            'income': round(income, 2),
            'expense': round(expense, 2),
            'balance': round(balance, 2),
            'budget': round(budget.amount, 2) if budget else None,
            'budgetUsed': round((expense / budget.amount * 100), 2) if budget else 0,
            'categoryStats': category_stats
        }
    })

@app.route('/api/stats/trend/<user_id>', methods=['GET'])
def get_expense_trend(user_id):
    months = int(request.args.get('months', 6))
    today = datetime.now()
    trends = []
    
    for i in range(months - 1, -1, -1):
        month_num = today.month - i
        year = today.year
        
        # 处理跨年情况
        if month_num <= 0:
            month_num += 12
            year -= 1
        
        month_str = f'{year}-{month_num:02d}'
        
        # 获取该月的统计数据
        stats_response = get_monthly_stats(user_id, month_str)
        if stats_response.is_json:
            stats_data = stats_response.get_json()
            if stats_data['success']:
                trends.append({
                    'month': month_str,
                    'expense': stats_data['stats']['expense'],
                    'income': stats_data['stats']['income']
                })
        else:
            trends.append({
                'month': month_str,
                'expense': 0,
                'income': 0
            })
    
    return jsonify({'success': True, 'trends': trends})

# 初始化数据库
@app.cli.command('init-db')
def init_db():
    with app.app_context():
        db.create_all()
        print('数据库已初始化')

# 主页路由
@app.route('/')
def index():
    return render_template('cloud ledger.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    # 确保在应用启动时创建数据库表
    with app.app_context():
        db.create_all()
    app.run(debug=True)
from flask_sqlalchemy import SQLAlchemy

# 初始化数据库对象，将在app.py中配置
db = SQLAlchemy()

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

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey('user.user_id'), nullable=False)
    type = db.Column(db.String(50))  # Bug 或 建议
    content = db.Column(db.Text, nullable=False)
    contact = db.Column(db.String(100))  # 联系方式（可选）
    created_at = db.Column(db.DateTime, server_default=db.func.now())
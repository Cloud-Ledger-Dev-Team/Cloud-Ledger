# controllers/main.py
from flask import Flask, request, jsonify, render_template
import os
import sys
from flask_jwt_extended import JWTManager, verify_jwt_in_request, get_jwt_identity
from functools import wraps

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入控制器蓝图
from controllers.user_controller import user_bp
from controllers.account_controller import account_bp
from controllers.bill_controller import bill_bp
from controllers.budget_controller import budget_bp
from controllers.category_controller import category_bp
from controllers.report_controller import report_bp
from controllers.transaction_controller import transaction_bp

# 从app.py导入已配置好的Flask应用实例和依赖
from controllers.app import app, jwt, db

# JWT认证装饰器
def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            # 检查请求参数中的user_id是否与token中的一致
            if request.args.get('user_id') and request.args.get('user_id') != current_user_id:
                return jsonify({'success': False, 'error': '无权限访问该用户数据'}), 403
            # 检查路径参数中的user_id是否与token中的一致
            if 'user_id' in kwargs and kwargs['user_id'] != current_user_id:
                return jsonify({'success': False, 'error': '无权限访问该用户数据'}), 403
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'success': False, 'error': '未授权访问'}), 401
    return decorated_function

# 暂时注释蓝图注册，直接在main.py中定义注册路由
# app.register_blueprint(user_bp, url_prefix='/api')
# app.register_blueprint(account_bp, url_prefix='/api/accounts')
# app.register_blueprint(bill_bp, url_prefix='/api/bills')
# app.register_blueprint(budget_bp, url_prefix='/api/budgets')
# app.register_blueprint(category_bp, url_prefix='/api/categories')
# app.register_blueprint(report_bp, url_prefix='/api/reports')
# app.register_blueprint(transaction_bp, url_prefix='/api/transactions')

# 直接在main.py中定义注册路由
import uuid
from models.database_models import User, Account

@app.route('/api/register', methods=['POST'])
def register():
    """用户注册接口"""
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

# 数据分析相关路由 - 由于这些路由在report_controller中可能不存在，暂时保留
@app.route('/api/analytics/monthly/<user_id>/<month>', methods=['GET'])
@jwt_required
def get_monthly_analytics(user_id, month):
    # 这里应该调用report_controller中的对应函数
    # 由于之前的导入方式有问题，暂时返回一个示例响应
    return jsonify({'success': True, 'message': '获取月度数据分析'})

@app.route('/api/analytics/trend/<user_id>', methods=['GET'])
@jwt_required
def get_trend_analytics(user_id):
    # 这里应该调用report_controller中的对应函数
    return jsonify({'success': True, 'message': '获取趋势数据分析'})

# 视图路由
@app.route('/')
def index():
    return render_template('cloud_ledger.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# 404错误处理
@app.errorhandler(404)
def page_not_found(e):
    return render_template('cloud_ledger.html'), 404

# 页面路由 (home已在前面定义)

if __name__ == '__main__':
    # 运行应用
    app.run(debug=True, host='0.0.0.0', port=5000)
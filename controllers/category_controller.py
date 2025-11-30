# controllers/category_controller.py
from flask import jsonify, Blueprint, request

# 创建分类蓝图
category_bp = Blueprint('category_bp', __name__)

@category_bp.route('/', methods=['GET'], strict_slashes=False)
def get_categories():
    """获取预定义的收支分类"""
    # 返回预定义的收支分类
    categories = {
        'income': [
            '工资',
            '奖金',
            '投资收益',
            '兼职收入',
            '礼金',
            '其他收入'
        ],
        'expense': [
            '餐饮',
            '交通',
            '购物',
            '娱乐',
            '医疗',
            '教育',
            '房租',
            '水电煤气',
            '通讯费',
            '生活费',
            '其他支出'
        ]
    }
    
    return jsonify({
        'success': True,
        'categories': categories
    })

@category_bp.route('/', methods=['POST'], strict_slashes=False)
def add_category():
    """添加新分类"""
    # 此处可以实现动态添加分类的功能
    # 由于是静态分类系统，这里仅返回成功信息
    return jsonify({
        'success': True,
        'message': '分类添加功能暂未实现'
    })
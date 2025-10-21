# controllers/category_controller.py
from flask import request, jsonify
from models.category_model import Category

class CategoryController:
    """管理消费/收入分类"""

    def get_all_categories(self):
        categories = Category.get_all()
        return jsonify(categories)

    def add_category(self):
        data = request.get_json()
        result = Category.create(data)
        return jsonify(result)
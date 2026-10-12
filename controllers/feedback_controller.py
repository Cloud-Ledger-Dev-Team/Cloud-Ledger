# controllers/feedback_controller.py
from flask import Blueprint, request, jsonify
from models.database_models import db, Feedback
from flask_jwt_extended import jwt_required, get_jwt_identity

feedback_bp = Blueprint('feedback_bp', __name__)

@feedback_bp.route('/feedback', methods=['POST'], strict_slashes=False)
@jwt_required()
def submit_feedback():
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        # 验证必要字段
        if not data.get('content'):
            return jsonify({'success': False, 'error': '反馈内容不能为空'}), 400
        
        # 创建反馈记录
        new_feedback = Feedback(
            user_id=user_id,
            type=data.get('type'),  # Bug 或 建议
            content=data['content'],
            contact=data.get('contact')  # 联系方式（可选）
        )
        
        db.session.add(new_feedback)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '反馈提交成功', 'feedback_id': new_feedback.id}), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Feedback Error: {e}")
        return jsonify({'success': False, 'error': '服务器内部错误'}), 500

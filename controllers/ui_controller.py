from flask import Blueprint, send_from_directory

ui_bp = Blueprint('ui', __name__, url_prefix='')

@ui_bp.route('/cloud')
def cloud():
    return send_from_directory('views', 'cloud_ledger.html')

@ui_bp.route('/login')
def login():
    return send_from_directory('views', 'register_login.html')
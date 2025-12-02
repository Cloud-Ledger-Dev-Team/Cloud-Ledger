# main.py - 应用启动脚本

# 从controllers.app导入Flask应用实例
from controllers.app import app

if __name__ == '__main__':
    # 启动应用服务器
    # 注意：在生产环境中，应该使用gunicorn或uwsgi等WSGI服务器
    # debug=True仅用于开发环境
    app.run(debug=True, host='0.0.0.0', port=5000)
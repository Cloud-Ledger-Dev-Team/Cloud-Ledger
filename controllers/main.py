# main.py
from controllers.app import app

if __name__ == '__main__':
    # 启动应用
    print("Cloud Ledger 后端服务正在启动...")
    print("API 服务地址: http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
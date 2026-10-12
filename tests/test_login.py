import requests
import json

try:
    # 测试登录API
    print("测试登录API...")
    data = {'email': 'test@123.com', 'password': 'password123'}
    response = requests.post('http://localhost:5000/api/login', json=data)
    
    print(f"状态码: {response.status_code}")
    print(f"响应内容: {response.text}")
    
    # 尝试解析JSON
    try:
        json_response = response.json()
        print(f"JSON响应: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"无法解析JSON响应: {e}")
        
except Exception as e:
    print(f"发生错误: {e}")
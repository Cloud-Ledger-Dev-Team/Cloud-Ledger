// 端到端测试脚本 - 用于验证前后端对接

// 测试配置
const API_BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_NAME = '测试用户';
const TEST_PASSWORD = 'Test@123456';

// 执行所有测试
async function runAllTests() {
    console.log('开始执行端到端测试...');
    console.log('测试环境:', API_BASE_URL);
    
    try {
        // 1. 测试服务器连接
        await testServerConnection();
        
        // 2. 测试注册API
        await testRegisterAPI();
        
        // 3. 测试登录API
        await testLoginAPI();
        
        console.log('\n🎉 所有测试通过！前后端对接正常。');
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
    }
}

// 测试服务器连接
async function testServerConnection() {
    console.log('\n🔍 测试服务器连接...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/health`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log(`服务器响应状态: ${response.status}`);
        console.log('服务器响应头:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log('服务器健康检查响应:', data);
            console.log('✅ 服务器连接成功');
        } else {
            console.log('⚠️  服务器返回非成功状态码，但连接成功');
        }
    } catch (error) {
        console.log('尝试访问根路径作为备选...');
        // 尝试访问根路径作为备选
        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'GET',
                mode: 'cors'
            });
            console.log(`根路径响应状态: ${response.status}`);
            console.log('✅ 服务器连接成功');
        } catch (fallbackError) {
            console.error('❌ 服务器连接失败:', fallbackError.message);
            throw new Error('无法连接到服务器，请确保后端服务正在运行');
        }
    }
}

// 测试注册API
async function testRegisterAPI() {
    console.log('\n🔍 测试注册API...');
    console.log('测试数据:', { name: TEST_NAME, email: TEST_EMAIL });
    
    const registerData = {
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(registerData),
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log(`注册API响应状态: ${response.status}`);
        
        try {
            const data = await response.json();
            console.log('注册API响应数据:', data);
            
            if (response.ok && data.success) {
                console.log('✅ 注册API调用成功');
            } else {
                console.error('❌ 注册API返回错误:', data.error || '未知错误');
                throw new Error(`注册失败: ${data.error || '未知错误'}`);
            }
        } catch (jsonError) {
            const text = await response.text();
            console.log('注册API响应文本:', text);
            throw new Error(`注册API返回非JSON响应: ${text}`);
        }
    } catch (error) {
        console.error('❌ 注册API调用失败:', error.message);
        throw error;
    }
}

// 测试登录API
async function testLoginAPI() {
    console.log('\n🔍 测试登录API...');
    
    const loginData = {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(loginData),
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log(`登录API响应状态: ${response.status}`);
        
        try {
            const data = await response.json();
            console.log('登录API响应数据:', data);
            
            if (response.ok && data.success && data.access_token) {
                console.log('✅ 登录API调用成功');
                console.log('获取到token:', data.access_token.substring(0, 20) + '...');
            } else {
                console.error('❌ 登录API返回错误:', data.error || '未知错误');
                throw new Error(`登录失败: ${data.error || '未知错误'}`);
            }
        } catch (jsonError) {
            const text = await response.text();
            console.log('登录API响应文本:', text);
            throw new Error(`登录API返回非JSON响应: ${text}`);
        }
    } catch (error) {
        console.error('❌ 登录API调用失败:', error.message);
        throw error;
    }
}

// 添加一个简单的帮助函数用于在浏览器中显示结果
function displayResultsInBrowser(results) {
    if (typeof document !== 'undefined') {
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            z-index: 10000;
            font-family: monospace;
            white-space: pre-wrap;
        `;
        
        resultDiv.textContent = results;
        document.body.appendChild(resultDiv);
    }
}

// 如果是在浏览器环境中运行，自动执行测试
if (typeof window !== 'undefined') {
    // 等待页面加载完成
    window.addEventListener('load', async () => {
        console.log('页面加载完成，开始测试...');
        await runAllTests();
    });
} else {
    // 如果是在Node.js环境中运行，需要手动执行
    console.log('在Node.js环境中，使用 node tests/e2e_test.js 运行测试');
}

// 导出测试函数，以便在其他地方调用
module.exports = {
    runAllTests,
    testServerConnection,
    testRegisterAPI,
    testLoginAPI
};
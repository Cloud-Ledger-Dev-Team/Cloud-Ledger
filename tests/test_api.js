// 简单的API测试脚本 - 增强版
console.log('===== 测试脚本开始执行 =====');

// 直接定义API基础URL
const API_BASE_URL = 'http://localhost:5000';

// 网络诊断函数
async function networkDiagnostics() {
    console.log('\n测试0: 网络诊断');
    
    // 检查浏览器网络在线状态
    console.log('浏览器在线状态:', navigator.onLine);
    
    // 检查同源策略相关设置
    console.log('当前页面URL:', window.location.href);
    console.log('API基础URL:', API_BASE_URL);
    
    // 检查是否存在安全策略限制
    console.log('Content-Security-Policy:', document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content);
    
    // 尝试ping服务器 - 使用最简单的方法
    try {
        const startTime = performance.now();
        const pingResponse = await fetch(API_BASE_URL + '/api/ping', {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            cache: 'no-cache'
        });
        const endTime = performance.now();
        console.log('服务器响应时间:', (endTime - startTime).toFixed(2), 'ms');
        console.log('服务器状态码:', pingResponse.status);
    } catch (pingError) {
        console.error('服务器无法访问:', pingError.message);
    }
    
    // 检查端口5000是否开放 (模拟TCP连接测试)
    console.log('正在检查端口5000...');
    try {
        const socket = new WebSocket(`ws://localhost:5000/ws`);
        socket.onopen = () => {
            console.log('WebSocket连接成功 - 端口5000开放');
            socket.close();
        };
        socket.onerror = (error) => {
            console.log('WebSocket连接失败 - 可能服务器不支持WebSocket或端口被占用');
        };
        setTimeout(() => {
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.close();
                console.log('WebSocket连接超时');
            }
        }, 2000);
    } catch (wsError) {
        console.error('WebSocket测试错误:', wsError);
    }
}

// 测试预检请求
async function testPreflightRequest() {
    console.log('\n测试1: 发送OPTIONS预检请求');
    const registerUrl = API_BASE_URL + '/api/register';
    
    try {
        console.log('发送预检请求到:', registerUrl);
        const response = await fetch(registerUrl, {
            method: 'OPTIONS',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, X-Requested-With'
            },
            cache: 'no-cache'
        });
        
        console.log('预检请求成功，状态码:', response.status);
        console.log('响应头信息:');
        
        // 重点关注CORS相关的响应头
        const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 
                           'access-control-allow-headers', 'access-control-allow-credentials'];
        
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                console.log(`  ${header}: ${value}`);
            } else {
                console.log(`  ${header}: [未设置]`);
            }
        });
    } catch (error) {
        console.error('预检请求失败:', error);
        console.error('错误详情:', error.message);
        
        // 分析错误类型
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('可能的原因: 1. 服务器未运行 2. 网络问题 3. 防火墙阻止 4. CORS配置错误');
        }
    }
}

// 测试GET请求
async function testGetRequest() {
    console.log('\n测试2: 发送GET请求到公共端点');
    // 尝试多个可能的端点
    const endpoints = [
        API_BASE_URL + '/api/test',
        API_BASE_URL + '/',
        API_BASE_URL + '/api/ping',
        API_BASE_URL + '/health'
    ];
    
    for (const testUrl of endpoints) {
        console.log('\n尝试访问:', testUrl);
        try {
            console.log('发送GET请求到:', testUrl);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(testUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log('GET请求成功，状态码:', response.status);
            
            try {
                const data = await response.json();
                console.log('GET请求响应数据:', data);
            } catch (jsonError) {
                console.error('解析JSON失败:', jsonError);
                const text = await response.text();
                console.log('响应文本:', text);
            }
            
            // 如果成功，跳出循环
            break;
        } catch (error) {
            console.error('GET请求失败:', error);
            console.error('错误详情:', error.message);
        }
    }
}

// 直接使用fetch测试注册API
async function testDirectFetch() {
    try {
        console.log('\n测试3: 开始直接fetch测试...');
        
        // 准备请求参数
        const url = API_BASE_URL + '/api/register';
        // 使用临时测试账号
        const testData = {
            name: 'test_user_' + Date.now(),
            email: 'test_user_' + Date.now() + '@example.com',
            password: 'Test123456'
        };
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testData),
            mode: 'cors',
            credentials: 'include',
            cache: 'no-cache'
        };
        
        console.log('请求URL:', url);
        console.log('请求数据:', testData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // 发送请求
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('响应状态:', response.status);
        console.log('响应状态文本:', response.statusText);
        
        // 重点关注CORS相关的响应头
        const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods', 
                           'access-control-allow-headers', 'access-control-allow-credentials'];
        
        console.log('关键CORS响应头:');
        corsHeaders.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                console.log(`  ${header}: ${value}`);
            } else {
                console.log(`  ${header}: [未设置]`);
            }
        });
        
        // 尝试解析响应
        try {
            const data = await response.json();
            console.log('响应数据:', data);
        } catch (jsonError) {
            console.error('解析JSON失败:', jsonError);
            const text = await response.text();
            console.log('响应文本:', text);
        }
        
        return true;
    } catch (error) {
        console.error('直接fetch测试失败:', error);
        console.error('错误堆栈:', error.stack);
        
        if (error.name === 'AbortError') {
            console.error('请求超时 - 服务器可能没有响应');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.error('网络连接错误 - 请确认服务器正在运行');
        }
        
        return false;
    }
}

// 检查window.db对象的完整性
async function inspectWindowDb() {
    console.log('\n测试4: 检查window.db对象');
    
    console.log('window.db存在:', !!window.db);
    
    if (window.db) {
        console.log('window.db类型:', typeof window.db);
        console.log('window.db属性:', Object.keys(window.db));
        
        // 检查关键方法是否存在
        const requiredMethods = ['register', 'login', 'getCurrentUser', 'logout'];
        requiredMethods.forEach(method => {
            console.log(`方法 ${method} 存在:`, typeof window.db[method] === 'function');
        });
        
        // 检查API_BASE_URL
        console.log('API_BASE_URL:', window.db.API_BASE_URL);
        
        // 尝试直接调用getBaseUrl方法
        if (typeof window.db.getBaseUrl === 'function') {
            try {
                const baseUrl = window.db.getBaseUrl();
                console.log('getBaseUrl() 返回:', baseUrl);
            } catch (e) {
                console.error('调用getBaseUrl()失败:', e);
            }
        }
    } else {
        console.error('window.db对象不存在!');
        console.log('检查database.js是否正确加载');
    }
}

// 执行一系列测试
async function runTests() {
    console.log('开始执行API连接测试...');
    
    try {
        // 测试0: 网络诊断 - 检查网络状态
        await networkDiagnostics();
        
        // 测试1: 发送OPTIONS预检请求
        await testPreflightRequest();
        
        // 测试2: 直接发送GET请求到一个公共端点
        await testGetRequest();
        
        // 测试3: 尝试发送注册请求
        await testDirectFetch();
        
        // 测试4: 检查window.db对象的完整性
        await inspectWindowDb();
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
    
    console.log('===== 测试脚本执行完毕 =====');
}

// 立即执行测试
setTimeout(() => {
    console.log('延迟执行测试以确保页面加载完成...');
    runTests();
    // 5秒后自动重新执行测试，确保捕获最新状态
    setTimeout(runTests, 5000);
}, 1000);

// 导出测试函数供其他脚本调用
window.testAPI = { 
    testDirectFetch,
    networkDiagnostics,
    testPreflightRequest,
    testGetRequest,
    inspectWindowDb,
    runTests
};
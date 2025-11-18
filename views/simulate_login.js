// 模拟登录脚本
// 用于在前端模拟一个已登录的用户状态

function simulateLogin() {
    console.log('开始模拟用户登录...');
    
    // 设置模拟的用户信息
    const mockUser = {
        token: 'mock_jwt_token_for_testing_12345',
        user_id: '1',
        username: '测试用户',
        user_email: 'test@example.com'
    };
    
    // 设置token过期时间（24小时后）
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // 存储用户信息到localStorage
    localStorage.setItem('token', mockUser.token);
    localStorage.setItem('user_id', mockUser.user_id);
    localStorage.setItem('username', mockUser.username);
    localStorage.setItem('user_email', mockUser.user_email);
    localStorage.setItem('token_expiry', tokenExpiry.toISOString());
    
    console.log('模拟登录成功！已设置以下用户信息：');
    console.log('token:', mockUser.token);
    console.log('user_id:', mockUser.user_id);
    console.log('username:', mockUser.username);
    console.log('user_email:', mockUser.user_email);
    console.log('token_expiry:', tokenExpiry.toISOString());
    
    // 已移除登录成功弹窗
    // 已移除页面自动刷新功能
}

// 在页面加载时自动执行模拟登录
if (document.readyState === 'complete') {
    simulateLogin();
} else {
    window.addEventListener('load', simulateLogin);
}
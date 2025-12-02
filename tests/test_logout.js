// 用于测试退出登录并查看滚动弹窗效果的脚本
function logoutAndTest() {
    // 清除所有登录相关的localStorage数据
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_email');
    
    console.log('已清除登录状态，准备重新加载页面...');
    
    // 延迟2秒后重新加载页面，让您可以看到控制台信息
    setTimeout(() => {
        location.reload();
    }, 2000);
}

// 在页面加载完成后执行
if (document.readyState === 'complete') {
    logoutAndTest();
} else {
    window.addEventListener('load', logoutAndTest);
}
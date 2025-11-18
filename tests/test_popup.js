// 测试底部弹窗是否能正常显示
console.log('测试底部弹窗脚本加载');

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载，尝试直接显示底部弹窗');
    
    // 移除可能影响弹窗显示的localStorage项
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    
    // 直接调用showBottomPopup函数
    if (typeof showBottomPopup === 'function') {
        console.log('showBottomPopup函数存在，尝试调用');
        showBottomPopup();
        console.log('showBottomPopup函数调用完成');
    } else {
        console.log('showBottomPopup函数不存在');
        
        // 如果函数不存在，尝试手动显示弹窗
        const popup = document.getElementById('bottomPopup');
        if (popup) {
            console.log('找到bottomPopup元素，尝试手动显示');
            popup.classList.remove('translate-y-full', 'opacity-0');
            popup.classList.add('translate-y-0', 'opacity-100');
        } else {
            console.log('未找到bottomPopup元素');
        }
    }
    
    // 检查弹窗元素的当前状态
    setTimeout(() => {
        const popup = document.getElementById('bottomPopup');
        if (popup) {
            console.log('弹窗当前类名:', popup.className);
        }
    }, 100);
});
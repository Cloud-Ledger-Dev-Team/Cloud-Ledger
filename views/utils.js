// views/utils.js - 工具函数

/**
 * 密码显示切换功能
 */
export function setupPasswordToggle(toggleId, passwordFieldId) {
    const toggleBtn = document.getElementById(toggleId);
    if (toggleBtn) {
        // 移除旧的监听器防止重复
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

        newBtn.addEventListener('click', function () {
            const passwordInput = document.getElementById(passwordFieldId);
            const icon = this.querySelector('i');

            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * 初始化所有密码切换
 */
export function initPasswordToggles() {
    setupPasswordToggle('toggleLoginPassword', 'loginPassword');
    setupPasswordToggle('toggleRegisterPassword', 'registerPassword');
    setupPasswordToggle('toggleConfirmRegisterPassword', 'confirmRegisterPassword');
    setupPasswordToggle('toggleBottomLoginPassword', 'bottomLoginPassword');
}

/**
 * 显示输入框错误消息
 */
export function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');

        // 尝试给对应的 input 加红框
        const inputId = elementId.replace('Error', '');
        const input = document.getElementById(inputId);
        if (input) input.classList.add('border-red-500', 'focus:ring-red-200');
    }
}

/**
 * 隐藏错误消息
 */
export function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');

        const inputId = elementId.replace('Error', '');
        const input = document.getElementById(inputId);
        if (input) input.classList.remove('border-red-500', 'focus:ring-red-200');
    }
}

/**
 * 检查是否已登录
 */
export function checkUserLoggedIn() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    return token && userId;
}

/**
 * 检查是否滚动到底部
 */
export function isScrolledToBottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
}
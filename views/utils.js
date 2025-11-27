// 通用工具函数

/**
 * 密码显示切换功能
 * @param {string} toggleId - 切换按钮的ID
 * @param {string} passwordFieldId - 密码输入框的ID
 */
export function setupPasswordToggle(toggleId, passwordFieldId) {
    document.getElementById(toggleId)?.addEventListener('click', function () {
        const passwordInput = document.getElementById(passwordFieldId);
        const icon = this.querySelector('i');

        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

/**
 * 初始化密码显示切换功能
 */
export function initPasswordToggles() {
    // 登录表单密码切换
    if (document.getElementById('toggleLoginPassword') && document.getElementById('loginPassword')) {
        setupPasswordToggle('toggleLoginPassword', 'loginPassword');
    }
    // 注册表单密码切换
    if (document.getElementById('toggleRegisterPassword') && document.getElementById('registerPassword')) {
        setupPasswordToggle('toggleRegisterPassword', 'registerPassword');
    }
    // 注册表单确认密码切换
    if (document.getElementById('toggleConfirmRegisterPassword') && document.getElementById('confirmRegisterPassword')) {
        setupPasswordToggle('toggleConfirmRegisterPassword', 'confirmRegisterPassword');
    }
    // 底部弹窗密码切换
    if (document.getElementById('toggleBottomLoginPassword') && document.getElementById('bottomLoginPassword')) {
        setupPasswordToggle('toggleBottomLoginPassword', 'bottomLoginPassword');
    }
}

/**
 * 显示错误消息
 * @param {string} elementId - 错误提示元素的ID
 * @param {string} message - 错误消息内容
 */
export function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');

        // 添加输入框错误样式
        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }
}

/**
 * 隐藏错误消息
 * @param {string} elementId - 错误提示元素的ID
 */
export function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.add('hidden');

        // 移除输入框错误样式
        const inputId = elementId.replace('Error', '');
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} - 用户是否已登录
 */
export function checkUserLoggedIn() {
    // 检查localStorage中是否有用户信息
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');

    // 如果有用户信息，认为用户已登录
    const isLoggedIn = token && userId;

    // 更新用户信息显示
    const usernameElement = document.getElementById('username');
    const userEmailElement = document.getElementById('userEmail');
    if (isLoggedIn) {
        if (usernameElement) {
            usernameElement.textContent = username || '用户';
        }
        if (userEmailElement) {
            // 尝试从localStorage获取邮箱，如果没有则显示示例邮箱
            const userEmail = localStorage.getItem('user_email') || 'user@example.com';
            userEmailElement.textContent = userEmail;
        }
    }

    return isLoggedIn;
}

/**
 * 检查是否滚动到底部
 * @returns {boolean} - 是否已滚动到底部
 */
export function isScrolledToBottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
}
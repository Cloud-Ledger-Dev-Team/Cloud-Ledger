// 认证相关功能

// 导入模态框功能
import { showToastModal, closeAuthModal, hideBottomPopup } from './modal.js';

// 导入工具函数
import { showError, hideError } from './utils.js';

/**
 * 处理注册表单提交
 * @param {Event} event - 表单提交事件
 */
export function handleRegisterFormSubmit(event) {
    event.preventDefault();
    console.log('注册表单提交');

    // 获取表单数据
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmRegisterPassword').value;

    // 隐藏所有错误提示
    hideError('registerEmailError');
    hideError('registerUsernameError');
    hideError('registerPasswordError');
    hideError('confirmRegisterPasswordError');

    // 表单验证
    let isValid = true;

    // 邮箱验证
    if (!email || !email.includes('@')) {
        showError('registerEmailError', '请输入有效的邮箱地址');
        isValid = false;
    }

    // 用户名验证
    if (!username || username.trim().length < 3) {
        showError('registerUsernameError', '用户名至少需要3个字符');
        isValid = false;
    }

    // 密码验证
    if (!password || password.length < 6) {
        showError('registerPasswordError', '密码至少需要6个字符');
        isValid = false;
    }

    // 确认密码验证
    if (password !== confirmPassword) {
        showError('confirmRegisterPasswordError', '两次输入的密码不一致');
        isValid = false;
    }

    if (isValid) {
        // 模拟API请求注册用户
        console.log('注册数据:', { email, username, password });

        // 这里应该是一个实际的API调用
        // 为了演示，我们假设注册成功
        showToastModal('注册成功', '您的账户已成功创建，请登录', () => {
            switchToLoginTab();
        });

        // 清空表单
        document.getElementById('registerForm').reset();
    }
}

/**
 * 处理登录表单提交
 * @param {Event} event - 表单提交事件
 */
export function handleLoginFormSubmit(event) {
    event.preventDefault();
    console.log('登录表单提交');

    // 获取表单数据
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 隐藏所有错误提示
    hideError('loginEmailError');
    hideError('loginPasswordError');

    // 表单验证
    let isValid = true;

    // 邮箱验证
    if (!email || !email.includes('@')) {
        showError('loginEmailError', '请输入有效的邮箱地址');
        isValid = false;
    }

    // 密码验证
    if (!password) {
        showError('loginPasswordError', '请输入密码');
        isValid = false;
    }

    if (isValid) {
        // 模拟API请求登录用户
        console.log('登录数据:', { email, password });

        // 这里应该是一个实际的API调用
        // 为了演示，我们假设登录成功并设置localStorage
        localStorage.setItem('token', 'mock_jwt_token');
        localStorage.setItem('user_id', '123');
        localStorage.setItem('username', '测试用户');
        localStorage.setItem('user_email', email);

        // 显示成功消息
        showToastModal('登录成功', '欢迎回来！');
        // 登录成功后直接跳转到主页面，无需等待用户点击弹窗按钮
        setTimeout(() => {
            window.location.href = 'cloud_ledger.html';
        }, 1000);
    }
}

/**
 * 处理底部弹窗登录表单提交
 * @param {Event} event - 表单提交事件
 */
export function handleBottomLoginFormSubmit(event) {
    event.preventDefault();
    console.log('底部弹窗登录表单提交');

    // 获取表单数据
    const email = document.getElementById('bottomLoginEmail').value;
    const password = document.getElementById('bottomLoginPassword').value;

    // 隐藏所有错误提示
    hideError('bottomLoginEmailError');
    hideError('bottomLoginPasswordError');

    // 表单验证
    let isValid = true;

    // 邮箱验证
    if (!email || !email.includes('@')) {
        showError('bottomLoginEmailError', '请输入有效的邮箱地址');
        isValid = false;
    }

    // 密码验证
    if (!password) {
        showError('bottomLoginPasswordError', '请输入密码');
        isValid = false;
    }

    if (isValid) {
        // 模拟API请求登录用户
        console.log('底部弹窗登录数据:', { email, password });

        // 这里应该是一个实际的API调用
        // 为了演示，我们假设登录成功并设置localStorage
        localStorage.setItem('token', 'mock_jwt_token');
        localStorage.setItem('user_id', '123');
        localStorage.setItem('username', '测试用户');
        localStorage.setItem('user_email', email);

        // 隐藏底部弹窗
        hideBottomPopup();

        // 显示成功消息
        showToastModal('登录成功', '欢迎回来！', () => {
            // 跳转到主页面
            window.location.href = 'cloud_ledger.html';
        });
    }
}

/**
 * 处理忘记密码表单提交
 * @param {Event} event - 表单提交事件
 */
export function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    console.log('忘记密码表单提交');

    // 获取表单数据
    const email = document.getElementById('forgotPasswordEmail').value;

    // 隐藏错误提示
    hideError('forgotPasswordEmailError');

    // 邮箱验证
    if (!email || !email.includes('@')) {
        showError('forgotPasswordEmailError', '请输入有效的邮箱地址');
        return;
    }

    // 模拟API请求发送重置邮件
    console.log('发送重置密码邮件到:', email);

    // 显示成功消息
    showToastModal('邮件已发送', '请检查您的邮箱以重置密码', () => {
        switchToLoginTab();
    });

    // 清空表单
    document.getElementById('forgotPasswordForm').reset();
}

/**
 * 切换到登录标签页
 */
export function switchToLoginTab() {
    // 隐藏其他标签页内容
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    
    // 显示登录表单
    document.getElementById('loginForm').classList.remove('hidden');
    
    // 更新标签页样式
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('forgotPasswordTab').classList.remove('active');
}

/**
 * 切换到注册标签页
 */
export function switchToRegisterTab() {
    // 隐藏其他标签页内容
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
    
    // 显示注册表单
    document.getElementById('registerForm').classList.remove('hidden');
    
    // 更新标签页样式
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('forgotPasswordTab').classList.remove('active');
}

/**
 * 切换到忘记密码标签页
 */
export function switchToForgotPasswordTab() {
    // 隐藏其他标签页内容
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    
    // 显示忘记密码表单
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
    
    // 更新标签页样式
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('forgotPasswordTab').classList.add('active');
}

/**
 * 注销当前用户
 */
export function logout() {
    // 清除localStorage中的用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_email');
    
    // 显示成功消息
    showToastModal('已注销', '您已成功注销账户', () => {
        // 刷新页面以更新用户状态
        location.reload();
    });
}
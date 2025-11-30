// views/auth.js - 认证与交互逻辑

import { showToastModal, hideBottomPopup, closeForgotPasswordModal } from './modal.js';
import { showError, hideError } from './utils.js';

// --- 表单提交处理 ---

export async function handleRegisterFormSubmit(event) {
    // 已经在 HTML 里写了 onsubmit="return false"，这里作为双保险
    if (event) event.preventDefault();
    console.log('正在提交注册...');

    const nameInput = document.getElementById('registerName');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmRegisterPassword');

    if (!nameInput || !emailInput || !passwordInput || !confirmInput) return;

    const username = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    ['registerNameError', 'registerEmailError', 'registerPasswordError', 'confirmRegisterPasswordError']
        .forEach(id => hideError(id));

    let isValid = true;
    if (!username || username.length < 2) { showError('registerNameError', '用户名太短'); isValid = false; }
    if (!email || !email.includes('@')) { showError('registerEmailError', '邮箱格式错误'); isValid = false; }
    if (!password || password.length < 6) { showError('registerPasswordError', '密码至少6位'); isValid = false; }
    if (password !== confirmPassword) { showError('confirmRegisterPasswordError', '两次密码不一致'); isValid = false; }

    if (isValid) {
        try {
            const result = await window.db.register({ name: username, email, password });
            if (result.success) {
                showToastModal('注册成功', '请登录', () => switchToLoginTab());
                document.getElementById('registerForm').reset();
            } else {
                showError('registerEmailError', result.error);
            }
        } catch (error) {
            showError('registerEmailError', '网络错误: ' + error.message);
        }
    }
}

export async function handleLoginFormSubmit(event) {
    if (event) event.preventDefault();
    console.log('正在提交登录...');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    hideError('loginEmailError');
    hideError('loginPasswordError');

    if (!email) { showError('loginEmailError', '请输入邮箱'); return; }
    if (!password) { showError('loginPasswordError', '请输入密码'); return; }

    try {
        const result = await window.db.login(email, password);
        if (result.success) {
            showToastModal('登录成功', '欢迎回来！');
            setTimeout(() => window.location.href = 'cloud_ledger.html', 1000);
        } else {
            showError('loginPasswordError', result.error || '登录失败');
        }
    } catch (error) {
        showError('loginPasswordError', '网络错误');
    }
}

export async function handleBottomLoginFormSubmit(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('bottomLoginEmail').value;
    const password = document.getElementById('bottomLoginPassword').value;

    hideError('bottomLoginEmailError');
    hideError('bottomLoginPasswordError');

    if (!email || !password) return;

    try {
        const result = await window.db.login(email, password);
        if (result.success) {
            hideBottomPopup();
            showToastModal('登录成功', '欢迎回来', () => window.location.href = 'cloud_ledger.html');
        } else {
            showError('bottomLoginPasswordError', result.error);
        }
    } catch (error) {
        showError('bottomLoginPasswordError', '网络错误');
    }
}

export async function handleForgotPasswordSubmit(event) {
    if (event) event.preventDefault();
    console.log('提交忘记密码...');

    const emailInput = document.getElementById('forgotEmail');
    const email = emailInput.value;

    hideError('forgotEmailError');
    if (!email || !email.includes('@')) {
        showError('forgotEmailError', '请输入有效邮箱');
        return;
    }

    const btn = document.getElementById('resetPasswordButton');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = oldText;
        btn.disabled = false;
        closeForgotPasswordModal();
        showToastModal('邮件已发送', `重置链接已发送至 ${email}`, () => switchToLoginTab());
        document.getElementById('forgotPasswordForm').reset();
    }, 1000);
}

// --- 【关键修复】标签页切换逻辑 ---

export function switchToLoginTab() {
    console.log('切换到登录页'); // 调试日志
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm')?.classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');

    updateTabStyles('loginTab', 'registerTab');
}

export function switchToRegisterTab() {
    console.log('切换到注册页'); // 调试日志
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm')?.classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');

    updateTabStyles('registerTab', 'loginTab');
}

export function switchToForgotPasswordTab() {
    console.log('切换到忘记密码页');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
}

function updateTabStyles(activeId, inactiveId) {
    const active = document.getElementById(activeId);
    const inactive = document.getElementById(inactiveId);

    if (active && inactive) {
        const activeCls = ['bg-white', 'text-primary', 'shadow-md', 'font-bold'];
        const inactiveCls = ['text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50', 'font-medium'];

        // 移除旧类，添加新类
        active.classList.remove(...inactiveCls);
        active.classList.add(...activeCls);

        inactive.classList.remove(...activeCls);
        inactive.classList.add(...inactiveCls);
    }
}

export function logout() {
    localStorage.clear();
    window.location.href = 'login_register.html';
}
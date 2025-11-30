// views/app.js - 前端主入口 (最终修复版)

import {
    setupPasswordToggle,
    initPasswordToggles,
    showError,
    hideError,
    checkUserLoggedIn,
    isScrolledToBottom
} from './utils.js';

import {
    showToastModal,
    closeToastModal,
    showAuthModal,
    closeAuthModal,
    hideBottomPopup,
    showForgotPasswordModal,
    closeForgotPasswordModal
} from './modal.js';

import {
    handleRegisterFormSubmit,
    handleLoginFormSubmit,
    handleBottomLoginFormSubmit,
    handleForgotPasswordSubmit,
    switchToLoginTab,
    switchToRegisterTab,
    switchToForgotPasswordTab,
    logout
} from './auth.js';

import {
    loadAccounts,
    editAccount,
    saveAccount,
    showAccountEditModal,
    closeAccountEditModal
} from './account.js';

import {
    switchBillType,
    initQuickInputOptions,
    handleBillFormSubmit,
    loadBills,
    initCategorySelection
} from './bill.js';

import {
    setupNavigation,
    switchPage
} from './navigation.js';

// 主初始化功能
export function initApp() {
    console.log('App Initializing...');
    initPasswordToggles();
    setupNavigation();
    bindEventListeners();

    // 检查登录状态
    if (checkUserLoggedIn()) {
        if (document.getElementById('userInfoPanel')) {
            initializeAppContent();
        }
    }
}

// 加载应用核心数据
function initializeAppContent() {
    const dateInput = document.getElementById('billDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    if (typeof initCategorySelection === 'function') initCategorySelection();
    if (typeof initQuickInputOptions === 'function') initQuickInputOptions();

    renderUserInfo();

    if (typeof loadAccounts === 'function') loadAccounts();
    if (typeof loadBills === 'function') loadBills();
}

// 渲染用户信息面板
function renderUserInfo() {
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('user_email');

    const panel = document.getElementById('userInfoPanel');
    const nameEl = document.getElementById('username');
    const emailEl = document.getElementById('userEmail');

    if (panel) {
        if (username && nameEl) nameEl.textContent = username;
        if (email && emailEl) emailEl.textContent = email;
        panel.classList.remove('hidden');
    }
}

// 绑定事件
function bindEventListeners() {
    // --- 1. 登录/注册页面交互 (之前漏掉的部分) ---

    // 标签页切换
    const loginTab = document.getElementById('loginTab');
    if (loginTab) loginTab.addEventListener('click', switchToLoginTab);

    const registerTab = document.getElementById('registerTab');
    if (registerTab) registerTab.addEventListener('click', switchToRegisterTab);

    // 忘记密码链接点击
    const forgotLink = document.getElementById('forgotPasswordLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }

    // 忘记密码弹窗关闭
    const closeForgotBtn = document.getElementById('closeForgotPasswordModal');
    if (closeForgotBtn) closeForgotBtn.addEventListener('click', closeForgotPasswordModal);

    // --- 2. 表单提交 ---

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginFormSubmit);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegisterFormSubmit);

    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPasswordSubmit);

    // --- 3. 主页交互 ---

    // 记账按钮
    const saveBillBtn = document.getElementById('saveBillButton');
    if (saveBillBtn) saveBillBtn.addEventListener('click', handleBillFormSubmit);

    // 账户保存
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveAccount();
        });
    }

    // 切换收支类型
    const expenseTab = document.getElementById('expenseTab');
    const incomeTab = document.getElementById('incomeTab');
    if (expenseTab) expenseTab.addEventListener('click', () => switchBillType('expense'));
    if (incomeTab) incomeTab.addEventListener('click', () => switchBillType('income'));

    // 弹窗关闭
    const closeToastBtn = document.getElementById('closeToastModalButton');
    if (closeToastBtn) closeToastBtn.addEventListener('click', closeToastModal);

    // 登出按钮
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// 暴露全局函数
window.setupPasswordToggle = setupPasswordToggle;
window.initPasswordToggles = initPasswordToggles;
window.showError = showError;
window.hideError = hideError;
window.checkUserLoggedIn = checkUserLoggedIn;

window.showToastModal = showToastModal;
window.closeToastModal = closeToastModal;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.showForgotPasswordModal = showForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;

window.handleRegisterFormSubmit = handleRegisterFormSubmit;
window.handleLoginFormSubmit = handleLoginFormSubmit;
window.handleBottomLoginFormSubmit = handleBottomLoginFormSubmit;
window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
window.switchToLoginTab = switchToLoginTab;
window.switchToRegisterTab = switchToRegisterTab;
window.switchToForgotPasswordTab = switchToForgotPasswordTab;
window.logout = logout;

window.loadAccounts = loadAccounts;
window.editAccount = editAccount;
window.saveAccount = saveAccount;
window.showAccountEditModal = showAccountEditModal;
window.closeAccountEditModal = closeAccountEditModal;

window.switchBillType = switchBillType;
window.handleBillFormSubmit = handleBillFormSubmit;
window.loadBills = loadBills;
window.initCategorySelection = initCategorySelection;

window.setupNavigation = setupNavigation;
window.switchPage = switchPage;
window.initApp = initApp;

document.addEventListener('DOMContentLoaded', initApp);
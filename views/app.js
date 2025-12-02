// views/app.js - 前端主入口 (访客模式支持版)

import {
    setupPasswordToggle,
    initPasswordToggles,
    showError,
    hideError,
    checkUserLoggedIn, // 这个函数只检查 localStorage，我们需要更强的逻辑
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
export async function initApp() {
    console.log('App Initializing...');
    initPasswordToggles();
    setupNavigation();
    bindEventListeners();

    // 1. 判断当前是否在主界面（存在 userInfoPanel 说明是主界面）
    if (document.getElementById('userInfoPanel')) {

        // 2. 检查是否有用户数据
        let userId = localStorage.getItem('user_id');

        // 3. 【核心逻辑】如果是直接打开且没数据，自动创建一个访客账号
        if (!userId) {
            console.log("检测到访客访问，正在初始化临时账号...");
            try {
                // 随机生成一个访客账号
                const guestName = 'Guest_' + Math.floor(Math.random() * 1000);
                const guestEmail = `guest_${Date.now()}@local.com`;
                const guestPwd = 'guestpassword';

                // 调用注册接口获取有效的 user_id
                const result = await window.db.register({
                    name: guestName,
                    email: guestEmail,
                    password: guestPwd
                });

                if (result.success) {
                    // 存入 localStorage，保证 CRUD 功能可用
                    localStorage.setItem('user_id', result.user.user_id);
                    localStorage.setItem('username', '访客');
                    localStorage.setItem('user_email', '本地模式');
                    console.log("访客账号初始化成功");
                }
            } catch (e) {
                console.error("访客初始化失败:", e);
            }
        }

        // 4. 加载业务数据 (此时 user_id 一定存在了)
        initializeAppContent();
    }
}

// 加载应用核心数据
function initializeAppContent() {
    const dateInput = document.getElementById('billDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    if (typeof initCategorySelection === 'function') initCategorySelection();
    if (typeof initQuickInputOptions === 'function') initQuickInputOptions();

    // 【关键】根据 session 标记决定是否显示左下角
    renderUserInfo();

    if (typeof loadAccounts === 'function') loadAccounts();
    if (typeof loadBills === 'function') loadBills();
}

// 渲染用户信息面板
function renderUserInfo() {
    const panel = document.getElementById('userInfoPanel');
    if (!panel) return;

    // 【关键修改】检查 sessionStorage 里的标记
    // 只有从登录页跳转过来的，才有这个标记
    const showPanel = sessionStorage.getItem('show_user_panel') === 'true';

    if (showPanel) {
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('user_email');
        const nameEl = document.getElementById('username');
        const emailEl = document.getElementById('userEmail');

        if (username && nameEl) nameEl.textContent = username;
        if (email && emailEl) emailEl.textContent = email;

        panel.classList.remove('hidden'); // 显示面板
    } else {
        panel.classList.add('hidden'); // 隐藏面板 (访客/直接打开)
    }
}

// 绑定事件 (保持不变)
function bindEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginFormSubmit);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegisterFormSubmit);

    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPasswordSubmit);

    const saveBillBtn = document.getElementById('saveBillButton');
    if (saveBillBtn) saveBillBtn.addEventListener('click', handleBillFormSubmit);

    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveAccount();
        });
    }

    const expenseTab = document.getElementById('expenseTab');
    const incomeTab = document.getElementById('incomeTab');
    if (expenseTab) expenseTab.addEventListener('click', () => switchBillType('expense'));
    if (incomeTab) incomeTab.addEventListener('click', () => switchBillType('income'));

    const closeToastBtn = document.getElementById('closeToastModalButton');
    if (closeToastBtn) closeToastBtn.addEventListener('click', closeToastModal);

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
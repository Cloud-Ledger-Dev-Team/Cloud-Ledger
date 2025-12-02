// views/app.js - 前端主入口 (修复快捷记账初始化)

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

    if (checkUserLoggedIn()) {
        if (document.getElementById('userInfoPanel')) {
            initializeAppContent();
        }
    }
}

function initializeAppContent() {
    const dateInput = document.getElementById('billDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // 【关键修复】手动触发一次类型切换，强制渲染快捷选项
    if (typeof switchBillType === 'function') {
        switchBillType('expense'); // 初始化显示支出项
    }

    renderUserInfo();

    if (typeof loadAccounts === 'function') loadAccounts();
    if (typeof loadBills === 'function') loadBills();
}

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

function bindEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLoginFormSubmit);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', handleRegisterFormSubmit);

    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPasswordSubmit);

    const loginTab = document.getElementById('loginTab');
    if (loginTab) loginTab.addEventListener('click', switchToLoginTab);

    const registerTab = document.getElementById('registerTab');
    if (registerTab) registerTab.addEventListener('click', switchToRegisterTab);

    const forgotLink = document.getElementById('forgotPasswordLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }

    const closeForgotBtn = document.getElementById('closeForgotPasswordModal');
    if (closeForgotBtn) closeForgotBtn.addEventListener('click', closeForgotPasswordModal);

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
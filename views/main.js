// views/main.js - 主入口

import { initPasswordToggles, checkUserLoggedIn } from './utils.js';
import { handleLoginFormSubmit, handleRegisterFormSubmit, handleForgotPasswordSubmit } from './auth.js';
import { loadAccounts, saveAccount, closeAccountEditModal } from './account.js';
// 引入修复后的分类选择函数
import { handleBillFormSubmit, switchBillType, initCategorySelection, initQuickInputOptions, loadBills } from './bill.js';
import { setupNavigation, switchPage } from './navigation.js';
import { showToastModal, closeToastModal, closeAuthModal, showForgotPasswordModal, closeForgotPasswordModal } from './modal.js';

export function initApp() {
    console.log('App Initializing...');
    initPasswordToggles();
    setupNavigation();
    bindEventListeners();

    if (checkUserLoggedIn()) {
        // 如果在主页，才初始化主页内容
        if (document.getElementById('billCategory')) {
            initializeAppContent();
        }
    }
}

function initializeAppContent() {
    const dateInput = document.getElementById('billDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // 【关键】必须调用这个函数，分类点击才会有反应
    if (typeof initCategorySelection === 'function') {
        initCategorySelection();
    }
    if (typeof initQuickInputOptions === 'function') {
        initQuickInputOptions();
    }

    if (typeof loadAccounts === 'function') loadAccounts();
    if (typeof loadBills === 'function') loadBills();
}

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
}

// 暴露给全局
window.initCategorySelection = initCategorySelection; // 确保全局可访问
window.initApp = initApp;
// ... (其他暴露保持不变或按需添加)

document.addEventListener('DOMContentLoaded', initApp);
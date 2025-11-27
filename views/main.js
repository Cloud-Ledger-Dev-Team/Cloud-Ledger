// 主初始化文件

// 导入工具函数
import { initPasswordToggles, isScrolledToBottom, checkUserLoggedIn } from './utils.js';

// 导入模态框功能
import { showAuthModal, closeAuthModal, hideBottomPopup, closeToastModal, closeVsDirModal } from './modal.js';

// 导入认证功能
import { handleLoginFormSubmit, handleRegisterFormSubmit, handleForgotPasswordSubmit, handleBottomLoginFormSubmit, switchToLoginTab, switchToRegisterTab, switchToForgotPasswordTab, logout } from './auth.js';

// 导入账户管理功能
import { saveAccount, showAccountEditModal, closeAccountEditModal } from './account.js';

// 导入账单管理功能
import { handleBillFormSubmit, switchBillType } from './bill.js';

// 导入导航功能
import { setupNavigation, switchPage } from './navigation.js';

/**
 * 初始化应用
 */
export function initApp() {
    console.log('初始化应用');
    
    // 初始化密码显示切换
    initPasswordToggles();
    
    // 设置导航菜单
    setupNavigation();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化页面内容
    const initialPage = 'homePage';
    switchPage(initialPage);
    
    // 监听滚动事件
    setupScrollListeners();
}

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    // 表单提交事件
    bindFormSubmitEvents();
    
    // 模态框相关事件
    bindModalEvents();
    
    // 导航相关事件
    bindNavigationEvents();
    
    // 账户管理相关事件
    bindAccountEvents();
    
    // 账单管理相关事件
    bindBillEvents();
}

/**
 * 绑定表单提交事件
 */
function bindFormSubmitEvents() {
    // 登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginFormSubmit);
    }
    
    // 注册表单
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterFormSubmit);
    }
    
    // 忘记密码表单
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
    }
    
    // 底部弹窗登录表单
    const bottomLoginForm = document.getElementById('bottomLoginForm');
    if (bottomLoginForm) {
        bottomLoginForm.addEventListener('submit', handleBottomLoginFormSubmit);
    }
    
    // 账单表单
    const billForm = document.getElementById('billForm');
    if (billForm) {
        billForm.addEventListener('submit', handleBillFormSubmit);
    }
    
    // 账户表单
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveAccount();
        });
    }
}

/**
 * 绑定模态框相关事件
 */
function bindModalEvents() {
    // 关闭VS目录信息模态框
    const closeVsDirModalBtn = document.getElementById('closeVsDirModalBtn');
    if (closeVsDirModalBtn) {
        closeVsDirModalBtn.addEventListener('click', closeVsDirModal);
    }
    
    // 关闭通用提示弹窗 - 右上角X按钮
    const closeToastModalXBtn = document.getElementById('closeToastModal');
    if (closeToastModalXBtn) {
        closeToastModalXBtn.addEventListener('click', closeToastModal);
    }
    
    // 关闭通用提示弹窗 - 底部确定按钮
    const closeToastModalOKBtn = document.getElementById('closeToastModalButton');
    if (closeToastModalOKBtn) {
        closeToastModalOKBtn.addEventListener('click', closeToastModal);
    }
    
    // 关闭登录注册模态框
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', closeAuthModal);
    }
    
    // 关闭底部弹窗
    const closeBottomPopupBtn = document.getElementById('closeBottomPopupBtn');
    if (closeBottomPopupBtn) {
        closeBottomPopupBtn.addEventListener('click', hideBottomPopup);
    }
    
    // 关闭账户编辑模态框
    const closeAccountEditModalBtn = document.getElementById('closeAccountEditModalBtn');
    if (closeAccountEditModalBtn) {
        closeAccountEditModalBtn.addEventListener('click', closeAccountEditModal);
    }
    
    // 登录标签页切换
    const loginTab = document.getElementById('loginTab');
    if (loginTab) {
        loginTab.addEventListener('click', switchToLoginTab);
    }
    
    // 注册标签页切换
    const registerTab = document.getElementById('registerTab');
    if (registerTab) {
        registerTab.addEventListener('click', switchToRegisterTab);
    }
    
    // 忘记密码标签页切换
    const forgotPasswordTab = document.getElementById('forgotPasswordTab');
    if (forgotPasswordTab) {
        forgotPasswordTab.addEventListener('click', switchToForgotPasswordTab);
    }
}

/**
 * 绑定导航相关事件
 */
function bindNavigationEvents() {
    // 首页导航
    const homeNavItem = document.getElementById('homeNavItem');
    const homeMobileNavItem = document.getElementById('homeMobileNavItem');
    if (homeNavItem) homeNavItem.addEventListener('click', () => switchPage('homePage'));
    if (homeMobileNavItem) homeMobileNavItem.addEventListener('click', () => switchPage('homePage'));
    
    // 账单导航
    const billsNavItem = document.getElementById('billsNavItem');
    const billsMobileNavItem = document.getElementById('billsMobileNavItem');
    if (billsNavItem) billsNavItem.addEventListener('click', () => switchPage('billsPage'));
    if (billsMobileNavItem) billsMobileNavItem.addEventListener('click', () => switchPage('billsPage'));
    
    // 账户导航
    const accountsNavItem = document.getElementById('accountsNavItem');
    const accountsMobileNavItem = document.getElementById('accountsMobileNavItem');
    if (accountsNavItem) accountsNavItem.addEventListener('click', () => switchPage('accountsPage'));
    if (accountsMobileNavItem) accountsMobileNavItem.addEventListener('click', () => switchPage('accountsPage'));
    
    // 添加账单导航
    const addBillNavItem = document.getElementById('addBillNavItem');
    const addBillMobileNavItem = document.getElementById('addBillMobileNavItem');
    if (addBillNavItem) addBillNavItem.addEventListener('click', () => switchPage('addBillPage'));
    if (addBillMobileNavItem) addBillMobileNavItem.addEventListener('click', () => switchPage('addBillPage'));
    
    // 登录导航
    const loginNavItem = document.getElementById('loginNavItem');
    const loginMobileNavItem = document.getElementById('loginMobileNavItem');
    if (loginNavItem) loginNavItem.addEventListener('click', showAuthModal);
    if (loginMobileNavItem) loginMobileNavItem.addEventListener('click', showAuthModal);
    
    // 注册导航
    const registerNavItem = document.getElementById('registerNavItem');
    const registerMobileNavItem = document.getElementById('registerMobileNavItem');
    if (registerNavItem) registerNavItem.addEventListener('click', function() {
        showAuthModal();
        setTimeout(() => switchToRegisterTab(), 100);
    });
    if (registerMobileNavItem) registerMobileNavItem.addEventListener('click', function() {
        showAuthModal();
        setTimeout(() => switchToRegisterTab(), 100);
    });
    
    // 注销导航
    const logoutNavItem = document.getElementById('logoutNavItem');
    if (logoutNavItem) logoutNavItem.addEventListener('click', logout);
}

/**
 * 绑定账户管理相关事件
 */
function bindAccountEvents() {
    // 添加账户按钮
    const addAccountBtn = document.getElementById('addAccountBtn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', function() {
            // 重置表单
            document.getElementById('accountForm').reset();
            document.getElementById('accountId').value = '';
            // 显示模态框
            showAccountEditModal();
        });
    }
}

/**
 * 绑定账单管理相关事件
 */
function bindBillEvents() {
    // 账单类型切换
    const expenseTypeBtn = document.getElementById('expenseType');
    const incomeTypeBtn = document.getElementById('incomeType');
    if (expenseTypeBtn) expenseTypeBtn.addEventListener('click', () => switchBillType('expense'));
    if (incomeTypeBtn) incomeTypeBtn.addEventListener('click', () => switchBillType('income'));
}

/**
 * 设置滚动监听器
 */
function setupScrollListeners() {
    // 监听滚动到底部显示底部弹窗
    window.addEventListener('scroll', function() {
        if (isScrolledToBottom() && !checkUserLoggedIn()) {
            // 延迟显示底部弹窗，避免频繁触发
            setTimeout(() => {
                if (isScrolledToBottom()) {
                    showBottomPopup();
                }
            }, 500);
        }
    });
}
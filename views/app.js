// Cloud-Ledger 主要入口文件
// 此文件已被拆分为多个模块，现仅作为导入和暴露的入口

// 导入工具函数
import { 
    setupPasswordToggle, 
    initPasswordToggles, 
    showError, 
    hideError, 
    checkUserLoggedIn, 
    isScrolledToBottom 
} from './utils.js';

// 导入模态框功能
import { 
    showVsDirModal, 
    closeVsDirModal, 
    showToastModal, 
    closeToastModal, 
    showAuthModal, 
    closeAuthModal, 
    showBottomPopup, 
    hideBottomPopup 
} from './modal.js';

// 导入认证功能
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

// 导入账户管理功能
import { 
    loadAccounts, 
    editAccount, 
    saveAccount, 
    deleteAccount, 
    showAccountEditModal, 
    closeAccountEditModal 
} from './account.js';

// 导入账单管理功能
import { 
    expenseCategories, 
    incomeCategories, 
    switchBillType, 
    initQuickInputOptions, 
    validateBillForm, 
    handleBillFormSubmit, 
    loadBills 
} from './bill.js';

// 导入统计功能
import { 
    loadMonthlyStats 
} from './stat.js';

// 导入导航功能
import { 
    setupNavigation, 
    switchPage 
} from './navigation.js';

// 导入主初始化功能
import { 
    initApp 
} from './main.js';

// 将所有函数暴露到全局作用域，以确保原有代码能正常工作
window.setupPasswordToggle = setupPasswordToggle;
window.initPasswordToggles = initPasswordToggles;
window.showError = showError;
window.hideError = hideError;
window.checkUserLoggedIn = checkUserLoggedIn;
window.isScrolledToBottom = isScrolledToBottom;

window.showVsDirModal = showVsDirModal;
window.closeVsDirModal = closeVsDirModal;
window.showToastModal = showToastModal;
window.closeToastModal = closeToastModal;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.showBottomPopup = showBottomPopup;
window.hideBottomPopup = hideBottomPopup;

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
window.deleteAccount = deleteAccount;
window.showAccountEditModal = showAccountEditModal;
window.closeAccountEditModal = closeAccountEditModal;

window.expenseCategories = expenseCategories;
window.incomeCategories = incomeCategories;
window.switchBillType = switchBillType;
window.initQuickInputOptions = initQuickInputOptions;
window.validateBillForm = validateBillForm;
window.handleBillFormSubmit = handleBillFormSubmit;
window.loadBills = loadBills;

window.loadMonthlyStats = loadMonthlyStats;

window.setupNavigation = setupNavigation;
window.switchPage = switchPage;

window.initApp = initApp;

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});
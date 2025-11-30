// views/navigation.js - 导航菜单逻辑

// 【关键修复】补全导入 checkUserLoggedIn
import { checkUserLoggedIn } from './utils.js';

/**
 * 设置导航菜单
 */
export function setupNavigation() {
    console.log('设置导航菜单');

    // 初始化导航项
    initNavItems();

    // 设置响应式导航菜单切换
    setupResponsiveNavToggle();

    // 设置下拉菜单
    setupDropdownMenus();
}

/**
 * 初始化导航项
 */
function initNavItems() {
    // 检查用户登录状态
    const isLoggedIn = checkUserLoggedIn();

    // 根据登录状态显示不同的导航项
    const loginNavItem = document.getElementById('loginNavItem');
    const registerNavItem = document.getElementById('registerNavItem');
    const userNavItem = document.getElementById('userNavItem');
    const logoutNavItem = document.getElementById('logoutNavItem');

    // (注意：这里要加上空值检查，防止报错)
    if (loginNavItem) {
        if (isLoggedIn) {
            loginNavItem.classList.add('hidden');
            if (registerNavItem) registerNavItem.classList.add('hidden');
            if (userNavItem) userNavItem.classList.remove('hidden');
            if (logoutNavItem) logoutNavItem.classList.remove('hidden');
        } else {
            loginNavItem.classList.remove('hidden');
            if (registerNavItem) registerNavItem.classList.remove('hidden');
            if (userNavItem) userNavItem.classList.add('hidden');
            if (logoutNavItem) logoutNavItem.classList.add('hidden');
        }
    }
}

/**
 * 设置响应式导航菜单切换
 */
function setupResponsiveNavToggle() {
    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');

    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('hidden');
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
}

/**
 * 设置下拉菜单
 */
function setupDropdownMenus() {
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdown = document.getElementById('userDropdown');

    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', function (e) {
            e.stopPropagation(); // 防止冒泡
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function (event) {
            if (!userDropdownToggle.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}

/**
 * 切换页面内容
 */
export function switchPage(pageId) {
    console.log(`切换到页面: ${pageId}`);

    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        initPageContent(pageId);
    }

    updateActiveNavItem(pageId);

    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav && !mobileNav.classList.contains('hidden')) {
        mobileNav.classList.add('hidden');
    }
}

function initPageContent(pageId) {
    switch (pageId) {
        case 'homePage':
            if (window.loadMonthlyStats) window.loadMonthlyStats();
            break;
        case 'billsPage':
            if (window.loadBills) window.loadBills();
            break;
        case 'accountsPage':
            if (window.loadAccounts) window.loadAccounts();
            break;
        case 'addBillPage':
            if (window.switchBillType) window.switchBillType('expense');
            if (window.initQuickInputOptions) window.initQuickInputOptions();
            const today = new Date().toISOString().split('T')[0];
            const billDateInput = document.getElementById('billDate');
            if (billDateInput) billDateInput.value = today;
            break;
    }
}

function updateActiveNavItem(pageId) {
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const navItemId = pageId.replace('Page', 'NavItem');
    const mobileNavItemId = pageId.replace('Page', 'MobileNavItem');

    const navItem = document.getElementById(navItemId);
    const mobileNavItem = document.getElementById(mobileNavItemId);

    if (navItem) navItem.classList.add('active');
    if (mobileNavItem) mobileNavItem.classList.add('active');
}
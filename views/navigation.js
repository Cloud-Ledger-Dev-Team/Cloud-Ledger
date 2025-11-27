// 导航菜单相关功能

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
    
    if (isLoggedIn) {
        // 用户已登录，显示用户信息和注销选项
        if (loginNavItem) loginNavItem.classList.add('hidden');
        if (registerNavItem) registerNavItem.classList.add('hidden');
        if (userNavItem) userNavItem.classList.remove('hidden');
        if (logoutNavItem) logoutNavItem.classList.remove('hidden');
    } else {
        // 用户未登录，显示登录和注册选项
        if (loginNavItem) loginNavItem.classList.remove('hidden');
        if (registerNavItem) registerNavItem.classList.remove('hidden');
        if (userNavItem) userNavItem.classList.add('hidden');
        if (logoutNavItem) logoutNavItem.classList.add('hidden');
    }
}

/**
 * 设置响应式导航菜单切换
 */
function setupResponsiveNavToggle() {
    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', function() {
            // 切换移动端导航显示状态
            mobileNav.classList.toggle('hidden');
            
            // 切换图标
            const icon = this.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
}

/**
 * 设置下拉菜单
 */
function setupDropdownMenus() {
    // 用户下拉菜单
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', function() {
            userDropdown.classList.toggle('hidden');
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', function(event) {
            if (!userDropdownToggle.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}

/**
 * 切换页面内容
 * @param {string} pageId - 要显示的页面ID
 */
export function switchPage(pageId) {
    console.log(`切换到页面: ${pageId}`);
    
    // 隐藏所有页面内容
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // 显示指定页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        
        // 根据页面ID执行相应的初始化操作
        initPageContent(pageId);
    }
    
    // 更新活动导航项
    updateActiveNavItem(pageId);
    
    // 在移动设备上，切换页面后隐藏导航菜单
    const mobileNav = document.getElementById('mobileNav');
    const navToggle = document.getElementById('navToggle');
    if (mobileNav && !mobileNav.classList.contains('hidden')) {
        mobileNav.classList.add('hidden');
        // 恢复图标
        const icon = navToggle?.querySelector('i');
        if (icon && icon.classList.contains('fa-times')) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

/**
 * 初始化页面内容
 * @param {string} pageId - 页面ID
 */
function initPageContent(pageId) {
    // 根据不同页面执行不同的初始化操作
    switch (pageId) {
        case 'homePage':
            // 首页初始化
            if (typeof loadMonthlyStats === 'function') {
                loadMonthlyStats();
            }
            break;
            
        case 'billsPage':
            // 账单页初始化
            if (typeof loadBills === 'function') {
                loadBills();
            }
            break;
            
        case 'accountsPage':
            // 账户页初始化
            if (typeof loadAccounts === 'function') {
                loadAccounts();
            }
            break;
            
        case 'addBillPage':
            // 添加账单页初始化
            if (typeof switchBillType === 'function') {
                switchBillType('expense');
            }
            if (typeof initQuickInputOptions === 'function') {
                initQuickInputOptions();
            }
            // 设置默认日期为今天
            const today = new Date().toISOString().split('T')[0];
            const billDateInput = document.getElementById('billDate');
            if (billDateInput) {
                billDateInput.value = today;
            }
            break;
            
        default:
            break;
    }
}

/**
 * 更新活动导航项
 * @param {string} pageId - 页面ID
 */
function updateActiveNavItem(pageId) {
    // 移除所有活动状态
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 为对应页面的导航项添加活动状态
    const navItemId = pageId.replace('Page', 'NavItem');
    const mobileNavItemId = pageId.replace('Page', 'MobileNavItem');
    
    const navItem = document.getElementById(navItemId);
    const mobileNavItem = document.getElementById(mobileNavItemId);
    
    if (navItem) navItem.classList.add('active');
    if (mobileNavItem) mobileNavItem.classList.add('active');
}
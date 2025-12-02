// views/account.js - 账户管理 (强力调试版)

import { showToastModal } from './modal.js';

// --- 1. 基础加载 ---

export async function loadAccounts() {
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) {
        console.warn("loadAccounts: 未检测到用户登录");
        return;
    }

    try {
        const accounts = await window.db.getAccounts(currentUser.userId);
        console.log("加载到的账户列表:", accounts);
        renderDashboardAccountList(accounts);
        populateAccountSelect(accounts);
        return accounts;
    } catch (error) {
        console.error("加载账户失败:", error);
        return [];
    }
}

function renderDashboardAccountList(accounts) {
    const container = document.getElementById('accountList');
    if (!container) return;

    container.innerHTML = '';
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF6B6B'];

    if (accounts.length === 0) {
        container.innerHTML = '<div class="text-gray-400 text-center py-4 text-sm">暂无账户</div>';
        return;
    }

    accounts.forEach((account, index) => {
        const color = colors[index % colors.length];
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2 hover:shadow-md transition-shadow group';
        div.innerHTML = `
            <div class="flex items-center overflow-hidden">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white mr-3" style="background-color: ${color}">
                    <i class="fas fa-wallet"></i>
                </div>
                <div class="truncate">
                    <div class="font-medium text-gray-800 truncate" title="${account.name}">${account.name}</div>
                    <div class="text-xs text-gray-500">${account.type}</div>
                </div>
            </div>
            <div class="flex items-center flex-shrink-0 ml-2">
                <div class="text-sm font-bold text-gray-700 mr-2">¥${parseFloat(account.balance).toFixed(2)}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function populateAccountSelect(accounts) {
    const select = document.getElementById('accountSelect');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">请选择账户</option>';
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.account_id;
        option.textContent = `${account.name} (¥${account.balance})`;
        select.appendChild(option);
    });
    if (currentValue) select.value = currentValue;
}

// --- 2. 弹窗与交互逻辑 ---

window.openAccountModal = function (id = '', name = '', type = '现金', balance = '') {
    const modal = document.getElementById('accountModal');
    if (!modal) {
        alert('错误：找不到弹窗组件 #accountModal，请检查 HTML');
        return;
    }

    // 安全获取元素，防止报错
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setVal('accModalId', id);
    setVal('accModalName', name);
    setVal('accModalType', type);
    setVal('accModalBalance', balance);

    const title = document.getElementById('accModalTitle');
    if (title) title.textContent = id ? '编辑账户' : '新建账户';

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = document.getElementById('accModalContent');
        if (content) content.classList.remove('scale-90', 'opacity-0');
    }, 10);
}

window.closeAccountModal = function () {
    const modal = document.getElementById('accountModal');
    const content = document.getElementById('accModalContent');
    if (!modal) return;

    if (content) content.classList.add('scale-90', 'opacity-0');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// 【核心修复】保存逻辑 (增加详细日志和 Fallback 提示)
window.handleAccountSubmit = async function () {
    console.log(">>> 触发保存账户逻辑");

    const nameEl = document.getElementById('accModalName');
    if (!nameEl) { console.error("找不到账户名称输入框"); return; }

    const name = nameEl.value;
    const id = document.getElementById('accModalId')?.value;
    const type = document.getElementById('accModalType')?.value;
    const balance = document.getElementById('accModalBalance')?.value;

    console.log("表单数据:", { id, name, type, balance });

    if (!name) {
        alert('请输入账户名称');
        return;
    }

    // 检查用户登录状态
    const currentUser = window.db.getCurrentUser();
    console.log("当前用户信息:", currentUser);

    if (!currentUser || !currentUser.userId) {
        alert('登录状态已失效，请重新登录！(LocalStorage 中未找到 user_id)');
        window.location.href = 'login_register.html'; // 强制跳回登录
        return;
    }

    const data = {
        user_id: currentUser.userId,
        name: name,
        type: type,
        balance: balance ? parseFloat(balance) : 0.0
    };

    try {
        let result;
        if (id) {
            console.log("发送更新请求...", data);
            result = await window.db.updateAccount(id, data);
        } else {
            console.log("发送新建请求...", data);
            result = await window.db.addAccount(data);
        }

        console.log("后端响应:", result);

        if (result.success) {
            // 成功
            window.closeAccountModal();
            loadAccounts(); // 刷新侧边栏

            // 刷新列表页
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav && activeNav.textContent.includes('账户管理')) {
                activeNav.click();
            }

            // 尝试使用美观弹窗，失败则用 alert
            try { showToastModal('成功', '保存成功'); } catch (e) { alert('保存成功'); }

        } else {
            // 失败
            console.error("业务逻辑失败:", result.error);
            alert('保存失败: ' + (result.error || '未知错误'));
        }
    } catch (e) {
        console.error("网络请求异常:", e);
        alert('网络错误: ' + e.message);
    }
}

window.deleteAccount = async function (accountId) {
    if (!confirm('确定要删除该账户吗？')) return;

    try {
        const result = await window.db.deleteAccount(accountId);
        if (result.success) {
            try { showToastModal('成功', '账户已删除'); } catch (e) { alert('已删除'); }
            loadAccounts();
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav && activeNav.textContent.includes('账户管理')) {
                activeNav.click();
            }
        } else {
            alert('删除失败: ' + result.error);
        }
    } catch (e) {
        alert('错误: ' + e.message);
    }
}

// 导出兼容
export const saveAccount = () => window.handleAccountSubmit();
export const showAccountEditModal = () => window.openAccountModal();
export const closeAccountEditModal = () => window.closeAccountModal();
export const editAccount = (id) => window.openAccountModal(id);
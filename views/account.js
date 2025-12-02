// views/account.js - 账户管理核心逻辑 (最终修正版)

import { showToastModal } from './modal.js';

// --- 1. 基础加载 ---

export async function loadAccounts() {
    // 刷新数据
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    try {
        const accounts = await window.db.getAccounts(currentUser.userId);
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

// --- 2. 弹窗逻辑 (挂载到 Window) ---

// 打开账户弹窗 (新建或编辑)
window.openAccountModal = function (id = '', name = '', type = '现金', balance = '') {
    const modal = document.getElementById('accountModal');
    if (!modal) {
        console.error("找不到 ID 为 accountModal 的弹窗元素！请检查 HTML");
        return;
    }

    // 填充表单
    document.getElementById('accModalId').value = id;
    document.getElementById('accModalName').value = name;
    document.getElementById('accModalType').value = type;
    document.getElementById('accModalBalance').value = balance;

    document.getElementById('accModalTitle').textContent = id ? '编辑账户' : '新建账户';

    // 显示
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const content = document.getElementById('accModalContent');
        if (content) content.classList.remove('scale-90', 'opacity-0');
    }, 10);
}

// 关闭账户弹窗
window.closeAccountModal = function () {
    const modal = document.getElementById('accountModal');
    const content = document.getElementById('accModalContent');
    if (!modal) return;

    if (content) content.classList.add('scale-90', 'opacity-0');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

// 提交保存
window.handleAccountSubmit = async function () {
    const id = document.getElementById('accModalId').value;
    const name = document.getElementById('accModalName').value;
    const type = document.getElementById('accModalType').value;
    const balance = document.getElementById('accModalBalance').value;

    if (!name) { showToastModal('提示', '请输入账户名称'); return; }

    const currentUser = window.db.getCurrentUser();
    const data = {
        user_id: currentUser.userId,
        name: name,
        type: type,
        balance: balance ? parseFloat(balance) : 0.0
    };

    try {
        let result;
        if (id) {
            result = await window.db.updateAccount(id, data);
        } else {
            result = await window.db.addAccount(data);
        }

        if (result.success) {
            showToastModal('成功', id ? '账户已更新' : '账户已添加');
            window.closeAccountModal();
            loadAccounts(); // 刷新侧边栏

            // 如果在管理页，刷新管理列表
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav && activeNav.textContent.includes('账户管理')) {
                // 模拟重新点击导航来刷新
                activeNav.click();
            }
        } else {
            showToastModal('错误', result.error);
        }
    } catch (e) {
        showToastModal('错误', e.message);
    }
}

// 删除账户
window.deleteAccount = async function (accountId) {
    if (!confirm('确定要删除该账户吗？相关的账单统计可能会受到影响。')) return;

    try {
        const result = await window.db.deleteAccount(accountId);
        if (result.success) {
            showToastModal('成功', '账户已删除');
            loadAccounts();

            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav && activeNav.textContent.includes('账户管理')) {
                activeNav.click();
            }
        } else {
            showToastModal('错误', result.error || '删除失败');
        }
    } catch (e) {
        showToastModal('错误', e.message);
    }
}

// --- 3. 导出兼容 ---
export const saveAccount = () => window.handleAccountSubmit();
export const showAccountEditModal = () => window.openAccountModal();
export const closeAccountEditModal = () => window.closeAccountModal();
export const editAccount = (id) => window.openAccountModal(id);
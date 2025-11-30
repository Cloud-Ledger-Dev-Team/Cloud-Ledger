// views/account.js - 账户管理逻辑

import { showToastModal } from './modal.js';

/**
 * 加载账户列表
 */
export async function loadAccounts() {
    console.log('正在加载账户数据...');
    try {
        const currentUser = window.db.getCurrentUser();
        if (!currentUser) return;

        // 1. 调用后端 API 获取真实账户
        const accounts = await window.db.getAccounts(currentUser.userId);

        // 2. 渲染账户管理页面的列表
        renderAccountList(accounts);

        // 3. 填充记账页面的“选择账户”下拉框
        populateAccountSelect(accounts);

        return accounts;
    } catch (error) {
        console.error("加载账户失败:", error);
        return [];
    }
}

/**
 * 填充记账页面的账户下拉框
 */
function populateAccountSelect(accounts) {
    const select = document.getElementById('accountSelect');
    if (!select) return;

    // 保留第一个“请选择”选项，清除其他的
    select.innerHTML = '<option value="">请选择账户</option>';

    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.account_id;
        option.textContent = `${account.name} (余额: ¥${account.balance})`;
        select.appendChild(option);
    });
}

/**
 * 渲染账户列表 DOM
 */
function renderAccountList(accounts) {
    const listContainers = [
        document.getElementById('accountList'), // 首页右侧或账户页
    ];

    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#FF6B6B'];

    listContainers.forEach(container => {
        if (!container) return;
        container.innerHTML = ''; // 清空

        if (accounts.length === 0) {
            container.innerHTML = '<div class="text-gray-400 text-center py-4">暂无账户，请添加</div>';
            return;
        }

        accounts.forEach((account, index) => {
            const color = colors[index % colors.length];
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2 hover:shadow-md transition-shadow';
            div.innerHTML = `
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white mr-3" style="background-color: ${color}">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div>
                        <div class="font-medium text-gray-800">${account.name}</div>
                        <div class="text-xs text-gray-500">${account.type}</div>
                    </div>
                </div>
                <div class="flex items-center">
                    <div class="text-lg font-bold text-gray-700 mr-3">¥${parseFloat(account.balance).toFixed(2)}</div>
                    <button class="text-red-400 hover:text-red-600" onclick="deleteAccount('${account.account_id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

/**
 * 保存账户 (新增)
 */
export async function saveAccount() {
    const name = document.getElementById('accountName').value;
    const balance = document.getElementById('accountBalance').value;

    const initialBalance = balance ? parseFloat(balance) : 0.0;

    if (!name) {
        showToastModal('提示', '请输入账户名称');
        return;
    }

    const currentUser = window.db.getCurrentUser();

    const accountData = {
        user_id: currentUser.userId,
        name: name,
        type: '现金',
        balance: initialBalance
    };

    try {
        const result = await window.db.addAccount(accountData);
        if (result.success) {
            showToastModal('成功', '账户添加成功');
            closeAccountEditModal(); // 关闭弹窗
            loadAccounts(); // 重新加载
        } else {
            showToastModal('错误', result.error || '添加失败');
        }
    } catch (error) {
        showToastModal('错误', '网络错误: ' + error.message);
    }
}

// 【关键修复】补全主文件需要的弹窗控制函数，并添加 export
export function showAccountEditModal() {
    const modal = document.getElementById('accountEditModal');
    const modalContent = document.getElementById('accountEditModalContentContainer');
    if (modal && modalContent) {
        // 清空旧数据
        document.getElementById('accountForm').reset();
        document.getElementById('accountId').value = '';

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-90', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

export function closeAccountEditModal() {
    const modal = document.getElementById('accountEditModal');
    const modalContent = document.getElementById('accountEditModalContentContainer');
    if (modal && modalContent) {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-90', 'opacity-0');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

// 供编辑使用的空函数（预留）
export function editAccount(accountId) {
    console.log("编辑账户功能暂未完全实装", accountId);
    showAccountEditModal();
}

/**
 * 删除账户 (挂载到 window 以便 HTML onclick 调用)
 */
window.deleteAccount = async function (accountId) {
    if (!confirm('确定要删除该账户吗？相关账单可能也会受到影响。')) return;

    try {
        const result = await window.db.deleteAccount(accountId);
        if (result.success) {
            showToastModal('成功', '账户已删除');
            loadAccounts(); // 刷新
        } else {
            showToastModal('错误', result.error || '删除失败');
        }
    } catch (error) {
        console.error(error);
    }
}

// 导出给全局使用
window.loadAccounts = loadAccounts;
window.saveAccount = saveAccount;
window.closeAccountEditModal = closeAccountEditModal;
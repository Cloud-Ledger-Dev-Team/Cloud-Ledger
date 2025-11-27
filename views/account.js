// 账户管理相关功能

// 导入模态框功能
import { showToastModal } from './modal.js';

/**
 * 加载账户列表
 */
export function loadAccounts() {
    // 模拟API请求加载账户数据
    console.log('加载账户列表');
    
    // 这里应该是一个实际的API调用
    // 为了演示，我们使用模拟数据
    const mockAccounts = [
        { id: 1, name: '现金', balance: 1000, color: '#FF6B6B' },
        { id: 2, name: '支付宝', balance: 5000, color: '#4ECDC4' },
        { id: 3, name: '微信钱包', balance: 2000, color: '#FFE66D' }
    ];
    
    // 存储到localStorage中模拟数据持久化
    localStorage.setItem('accounts', JSON.stringify(mockAccounts));
    
    // 更新账户列表显示
    renderAccountList(mockAccounts);
    
    return mockAccounts;
}

/**
 * 渲染账户列表
 * @param {Array} accounts - 账户数据数组
 */
function renderAccountList(accounts) {
    const accountListElement = document.getElementById('accountList');
    if (!accountListElement) return;
    
    // 清空现有列表
    accountListElement.innerHTML = '';
    
    // 添加每个账户项
    accounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.className = 'account-item p-4 mb-3 rounded-lg bg-white shadow-md transition-all hover:shadow-lg';
        accountItem.dataset.accountId = account.id;
        
        // 账户图标容器 - 动态颜色
        const iconContainer = document.createElement('div');
        iconContainer.className = 'account-icon w-12 h-12 rounded-full flex items-center justify-center mb-2';
        iconContainer.style.backgroundColor = account.color;
        
        // 账户图标
        const icon = document.createElement('i');
        icon.className = 'fas fa-wallet text-white text-xl';
        iconContainer.appendChild(icon);
        
        // 账户信息
        const accountInfo = document.createElement('div');
        accountInfo.className = 'account-info';
        
        // 账户名称
        const accountName = document.createElement('h4');
        accountName.className = 'account-name text-lg font-semibold mb-1';
        accountName.textContent = account.name;
        
        // 账户余额
        const accountBalance = document.createElement('p');
        accountBalance.className = 'account-balance text-xl font-bold text-gray-700';
        accountBalance.textContent = `¥${account.balance.toFixed(2)}`;
        
        accountInfo.appendChild(accountName);
        accountInfo.appendChild(accountBalance);
        
        // 操作按钮容器
        const actions = document.createElement('div');
        actions.className = 'account-actions flex space-x-2 mt-3';
        
        // 编辑按钮
        const editButton = document.createElement('button');
        editButton.className = 'edit-account-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
        editButton.innerHTML = '<i class="fas fa-edit mr-1"></i> 编辑';
        editButton.addEventListener('click', function() {
            editAccount(account.id);
        });
        
        // 删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-account-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors';
        deleteButton.innerHTML = '<i class="fas fa-trash mr-1"></i> 删除';
        deleteButton.addEventListener('click', function() {
            deleteAccount(account.id);
        });
        
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        
        accountItem.appendChild(iconContainer);
        accountItem.appendChild(accountInfo);
        accountItem.appendChild(actions);
        
        accountListElement.appendChild(accountItem);
    });
}

/**
 * 编辑账户
 * @param {number} accountId - 账户ID
 */
export function editAccount(accountId) {
    // 从localStorage获取账户数据
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
        showToastModal('错误', '未找到账户信息');
        return;
    }
    
    // 填充表单数据
    document.getElementById('accountId').value = account.id;
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountBalance').value = account.balance;
    document.getElementById('accountColor').value = account.color;
    
    // 显示编辑账户模态框
    showAccountEditModal();
}

/**
 * 保存账户
 */
export function saveAccount() {
    // 获取表单数据
    const accountId = parseInt(document.getElementById('accountId').value);
    const name = document.getElementById('accountName').value;
    const balance = parseFloat(document.getElementById('accountBalance').value);
    const color = document.getElementById('accountColor').value;
    
    // 表单验证
    if (!name || isNaN(balance) || balance < 0) {
        showToastModal('错误', '请输入有效的账户信息');
        return;
    }
    
    // 从localStorage获取现有账户数据
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    
    if (accountId) {
        // 更新现有账户
        const index = accounts.findIndex(a => a.id === accountId);
        if (index !== -1) {
            accounts[index] = { ...accounts[index], name, balance, color };
        }
    } else {
        // 创建新账户
        const newAccount = {
            id: Date.now(), // 使用时间戳作为临时ID
            name,
            balance,
            color
        };
        accounts.push(newAccount);
    }
    
    // 保存到localStorage
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // 更新账户列表
    renderAccountList(accounts);
    
    // 关闭模态框
    closeAccountEditModal();
    
    // 显示成功消息
    showToastModal('成功', accountId ? '账户已更新' : '账户已创建');
}

/**
 * 删除账户
 * @param {number} accountId - 账户ID
 */
export function deleteAccount(accountId) {
    // 显示确认对话框
    if (confirm('确定要删除此账户吗？此操作无法撤销。')) {
        // 从localStorage获取账户数据
        let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        
        // 过滤掉要删除的账户
        accounts = accounts.filter(a => a.id !== accountId);
        
        // 保存到localStorage
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // 更新账户列表
        renderAccountList(accounts);
        
        // 显示成功消息
        showToastModal('成功', '账户已删除');
    }
}

/**
 * 显示账户编辑模态框
 */
export function showAccountEditModal() {
    const modal = document.getElementById('accountEditModal');
    const modalContent = document.getElementById('accountEditModalContentContainer');
    if (modal && modalContent) {
        // 显示模态框但保持透明度为0
        modal.classList.remove('hidden');
        // 使用setTimeout确保下一帧执行动画
        setTimeout(() => {
            // 背景淡入
            modal.classList.remove('opacity-0');
            // 内容由小变大
            modalContent.classList.remove('scale-90', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

/**
 * 关闭账户编辑模态框
 */
export function closeAccountEditModal() {
    const modal = document.getElementById('accountEditModal');
    const modalContent = document.getElementById('accountEditModalContentContainer');
    if (modal && modalContent) {
        // 内容由大变小
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-90', 'opacity-0');
        // 背景淡出
        modal.classList.add('opacity-0');
        // 等待动画完成后隐藏
        setTimeout(() => {
            modal.classList.add('hidden');
            // 重置表单
            document.getElementById('accountForm').reset();
            document.getElementById('accountId').value = '';
        }, 200);
    }
}
// views/bill.js - 账单管理核心逻辑 (修复分类弹窗版)

import { showToastModal } from './modal.js';
import { loadAccounts } from './account.js';
import { renderCharts } from './stat.js';

// --- 基础数据配置 ---
// 注意：实际项目中这些应该从后端获取，这里作为前端暂存
export const expenseCategories = [
    { id: 1, name: '餐饮', icon: 'fas fa-utensils' },
    { id: 2, name: '交通', icon: 'fas fa-car' },
    { id: 3, name: '购物', icon: 'fas fa-shopping-cart' },
    { id: 4, name: '娱乐', icon: 'fas fa-film' },
    { id: 5, name: '医疗', icon: 'fas fa-stethoscope' },
    { id: 6, name: '教育', icon: 'fas fa-graduation-cap' },
    { id: 7, name: '住房', icon: 'fas fa-home' },
    { id: 8, name: '其他', icon: 'fas fa-ellipsis-h' }
];

export const incomeCategories = [
    { id: 101, name: '工资', icon: 'fas fa-money-bill-wave' },
    { id: 102, name: '奖金', icon: 'fas fa-gift' },
    { id: 103, name: '投资', icon: 'fas fa-chart-line' },
    { id: 104, name: '兼职', icon: 'fas fa-briefcase' },
    { id: 105, name: '其他', icon: 'fas fa-ellipsis-h' }
];

const expenseQuickOptions = [
    { name: '午餐', category: '餐饮', amount: 20 },
    { name: '地铁', category: '交通', amount: 10 },
    { name: '日用品', category: '购物', amount: 50 },
    { name: '晚餐', category: '餐饮', amount: 40 }
];

const incomeQuickOptions = [
    { name: '工资', category: '工资', amount: 5000 },
    { name: '奖金', category: '奖金', amount: 1000 },
    { name: '兼职', category: '兼职', amount: 200 },
    { name: '红包', category: '礼金', amount: 100 }
];

// 保存当前筛选条件
let currentFilter = {};
// 待删除账单ID
let pendingDeleteBillId = null;

// 元素选择器
const totalIncomeEl = document.querySelector('#totalIncome');
const totalExpenseEl = document.querySelector('#totalExpense');
const balanceEl = document.querySelector('#totalBalance');


// --- 核心交互逻辑 ---

// 初始化分类点击
export function initCategorySelection() {
    const items = document.querySelectorAll('.category-item');
    if (items.length === 0) return;

    items.forEach(item => {
        // 移除旧事件防止重复绑定
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener('click', function () {
            const category = this.dataset.category;

            // 如果点击的是"其他"，弹出新建分类弹窗
            if (category === '其他' || category === 'other') {
                openCreateCategoryModal();
                return;
            }

            // 视觉选中效果
            selectCategoryVisuals(this);

            // 设置表单隐藏值
            const catInput = document.getElementById('billCategory');
            if (catInput) catInput.value = category;
        });
    });
}

// 辅助：处理选中的视觉效果
function selectCategoryVisuals(element) {
    document.querySelectorAll('.category-item').forEach(i => {
        i.classList.remove('selected', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
        i.classList.add('border-gray-200');
    });
    element.classList.remove('border-gray-200');
    element.classList.add('selected', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
}

// 【修改】打开新建分类弹窗 (不再使用 prompt)
function openCreateCategoryModal() {
    const input = document.getElementById('newCategoryInputName');
    if (input) input.value = ''; // 清空输入框
    openModal('newCategoryModal');
    // 自动聚焦输入框
    setTimeout(() => input && input.focus(), 100);
}

// 【修改】执行创建分类逻辑
function performCreateCategory() {
    const nameInput = document.getElementById('newCategoryInputName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('请输入分类名称');
        return;
    }

    const billType = document.getElementById('billType').value || 'expense';
    const currentCategories = billType === 'expense' ? expenseCategories : incomeCategories;

    // 检查重复
    if (currentCategories.some(cat => cat.name === name)) {
        alert('该分类已存在，请直接选择');
        return;
    }

    // 添加到数组
    const maxId = currentCategories.length > 0 ? Math.max(...currentCategories.map(cat => cat.id)) : 0;
    currentCategories.push({
        id: maxId + 1,
        name: name,
        icon: 'fas fa-tag' // 新分类给一个通用标签图标
    });

    // 关闭弹窗
    window.closeModal('newCategoryModal');

    // 重新渲染分类列表
    renderCategories();

    // 【关键修复】创建后立即选中
    setTimeout(() => {
        // 1. 尝试找到新生成的 DOM 元素并点击
        const newCategoryItem = document.querySelector(`.category-item[data-category="${name}"]`);
        if (newCategoryItem) {
            // 触发点击事件，这样会同时更新视觉效果和 input 值
            newCategoryItem.click();
        } else {
            // 保底逻辑：如果找不到DOM，强制设置值
            const catInput = document.getElementById('billCategory');
            if (catInput) catInput.value = name;
        }
    }, 150); // 稍微延时等待 DOM 渲染
}

// 渲染分类列表
function renderCategories() {
    const billType = document.getElementById('billType').value || 'expense';
    const categories = billType === 'expense' ? expenseCategories : incomeCategories;

    // 根据当前类型找到对应的容器
    const containerId = billType === 'expense' ? 'expenseCategories' : 'incomeCategories';
    const containerWrapper = document.getElementById(containerId);

    if (!containerWrapper) return;

    // 找到里面的 grid 容器 (通常是 h4 标题下面的 div)
    // 这里我们假设结构是 <div> <h4>...</h4> <div class="grid..."> </div> </div>
    // 为了简单起见，我们直接重建 grid 的内容。
    // 注意：我们需要保留 "其他" 按钮在最后，或者重新生成它。

    // 重新生成整个列表 HTML
    let html = `<h4 class="text-gray-700 font-medium mb-3">选择分类</h4>
                <div class="grid grid-cols-4 gap-3">`;

    categories.forEach(cat => {
        // 跳过"其他"，最后单独加，或者直接渲染
        if (cat.name === '其他' || cat.name === 'other') return;

        html += `
            <div class="category-item flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors" data-category="${cat.name}">
                <i class="${cat.icon} text-xl text-indigo-500 mb-2"></i>
                <span class="text-sm">${cat.name}</span>
            </div>
        `;
    });

    // 始终在最后添加 "其他"
    html += `
        <div class="category-item flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors" data-category="其他">
            <i class="fas fa-ellipsis-h text-xl text-gray-500 mb-2"></i>
            <span class="text-sm">其他</span>
        </div>
    </div>`; // 关闭 grid 和 container

    containerWrapper.innerHTML = html;

    // 重新绑定事件
    initCategorySelection();
}

// 切换收支类型
export function switchBillType(type) {
    const expenseBtn = document.getElementById('expenseTab');
    const incomeBtn = document.getElementById('incomeTab');

    if (expenseBtn && incomeBtn) {
        if (type === 'expense') {
            expenseBtn.classList.add('border-b-2', 'border-indigo-500', 'text-indigo-600');
            expenseBtn.classList.remove('text-gray-500');
            incomeBtn.classList.remove('border-b-2', 'border-indigo-500', 'text-indigo-600');
            incomeBtn.classList.add('text-gray-500');

            document.getElementById('expenseCategories').classList.remove('hidden');
            document.getElementById('incomeCategories').classList.add('hidden');

            renderQuickOptions(expenseQuickOptions);
        } else {
            incomeBtn.classList.add('border-b-2', 'border-indigo-500', 'text-indigo-600');
            incomeBtn.classList.remove('text-gray-500');
            expenseBtn.classList.remove('border-b-2', 'border-indigo-500', 'text-indigo-600');
            expenseBtn.classList.add('text-gray-500');

            document.getElementById('expenseCategories').classList.add('hidden');
            document.getElementById('incomeCategories').classList.remove('hidden');

            renderQuickOptions(incomeQuickOptions);
        }
    }

    const typeInput = document.getElementById('billType');
    if (typeInput) typeInput.value = type;

    // 清空当前的分类选择
    document.getElementById('billCategory').value = '';
    document.querySelectorAll('.category-item').forEach(i => {
        i.classList.remove('selected', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
        i.classList.add('border-gray-200');
    });

    setTimeout(initCategorySelection, 100);
}

// 渲染快捷选项
function renderQuickOptions(options) {
    const container = document.getElementById('quickInputOptions');
    if (!container) return;

    container.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quick-entry-btn px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm transition-colors hover:bg-gray-200';
        btn.dataset.category = opt.category;
        btn.dataset.amount = opt.amount;
        btn.textContent = `${opt.name} ${opt.amount}元`;
        container.appendChild(btn);
    });

    initQuickInputOptions();
}

// 初始化快捷按钮点击
export function initQuickInputOptions() {
    const container = document.getElementById('quickInputOptions');
    if (!container) return;

    container.onclick = function (e) {
        const btn = e.target.closest('.quick-entry-btn');
        if (!btn) return;

        e.preventDefault();
        const amtInput = document.getElementById('billAmount');
        if (amtInput) amtInput.value = btn.dataset.amount;

        const catItem = document.querySelector(`.category-item[data-category="${btn.dataset.category}"]`);
        if (catItem) {
            const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
            catItem.dispatchEvent(clickEvent);
        }
    };
}

// 提交表单
export async function handleBillFormSubmit(event) {
    if (event) event.preventDefault();

    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    const amount = document.getElementById('billAmount').value;
    const accountId = document.getElementById('accountSelect').value;
    const date = document.getElementById('billDate').value;
    const category = document.getElementById('billCategory').value; // 这里必须有值
    const type = document.getElementById('billType').value;
    const description = document.getElementById('billDescription').value;

    if (!amount) { try { showToastModal('提示', '请输入金额'); } catch (e) { alert('请输入金额'); } return; }
    if (!accountId) { try { showToastModal('提示', '请选择账户'); } catch (e) { alert('请选择账户'); } return; }
    if (!category) { try { showToastModal('提示', '请选择分类'); } catch (e) { alert('请选择分类（如果新建分类，请确保已点击确定）'); } return; }

    const billData = {
        user_id: currentUser.userId,
        account_id: accountId,
        amount: parseFloat(amount),
        type: type,
        category: category,
        date: date,
        description: description || (type === 'expense' ? '支出' : '收入')
    };

    try {
        const result = await window.db.addBill(billData);
        if (result.success) {
            try { showToastModal('成功', '账单已保存'); } catch (e) { alert('账单已保存'); }
            document.getElementById('billAmount').value = '';
            document.getElementById('billDescription').value = '';
            // 不清空分类，方便连续记账
            loadBills();
            loadAccounts();
        } else {
            alert(result.error || '保存失败');
        }
    } catch (error) {
        alert('网络错误: ' + error.message);
    }
}

// 通用打开弹窗函数
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            const content = modal.querySelector('[id$="Content"]'); // 匹配 id 结尾为 Content 的元素
            if (content) {
                content.classList.remove('scale-90', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    }
}

// 暴露给全局的关闭函数
window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const content = modal.querySelector('[id$="Content"]');
        if (content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-90', 'opacity-0');
        }
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}
window.closeEditBillModal = () => window.closeModal('editBillModal');


// --- 账单管理核心 ---

// 加载账单
export async function loadBills(filter = {}) {
    currentFilter = filter;
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    try {
        const queryParams = { user_id: currentUser.userId, ...filter };
        const bills = await window.db.getBills(queryParams);

        renderBills(bills);
        updateDashboardCards(bills);
        if (window.renderCharts) window.renderCharts(bills);

    } catch (error) {
        console.error("加载账单失败", error);
    }
}

function renderBills(bills) {
    const container = document.querySelector('#billList');
    if (!container) return;
    container.innerHTML = '';

    if (!bills.length) {
        container.innerHTML = '<div class="text-center text-gray-400 py-4">暂无账单数据</div>';
        return;
    }

    bills.forEach(bill => {
        const isExpense = bill.type === 'expense';
        const colorClass = isExpense ? 'text-red-500' : 'text-green-500';
        const sign = isExpense ? '-' : '+';
        const id = bill.bill_id || bill.transaction_id;

        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2';

        item.innerHTML = `
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isExpense ? 'bg-red-100' : 'bg-green-100'}">
                    <i class="fas ${bill.type === 'expense' ? 'fa-shopping-bag' : 'fa-wallet'} ${colorClass}"></i>
                </div>
                <div>
                    <div class="font-medium text-gray-800">${bill.category} <span class="text-xs text-gray-400 ml-2">${bill.date}</span></div>
                    <div class="text-xs text-gray-500">${bill.description || ''}</div>
                </div>
            </div>
            <div class="flex items-center">
                <div class="font-bold ${colorClass} mr-4">${sign}¥${parseFloat(bill.amount).toFixed(2)}</div>
                <div class="flex items-center">
                    <button class="text-blue-500 hover:text-blue-700 mr-3 edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="text-red-500 hover:text-red-700 del-btn" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        item.querySelector('.edit-btn').addEventListener('click', () => {
            window.openEditBillModal(id, bill.amount, bill.category, bill.description, bill.date);
        });

        item.querySelector('.del-btn').addEventListener('click', () => {
            window.triggerDeleteBill(id);
        });

        container.appendChild(item);
    });
}

function updateDashboardCards(bills) {
    let totalIncome = 0;
    let totalExpense = 0;
    bills.forEach(bill => {
        if (bill.type === 'income') totalIncome += parseFloat(bill.amount);
        else totalExpense += parseFloat(bill.amount);
    });
    const balance = totalIncome - totalExpense;

    if (totalIncomeEl) totalIncomeEl.textContent = totalIncome.toFixed(2);
    if (totalExpenseEl) totalExpenseEl.textContent = totalExpense.toFixed(2);
    if (balanceEl) balanceEl.textContent = balance.toFixed(2);
}

// --- Window 暴露 ---

window.openEditBillModal = function (id, amount, category, desc, date) {
    if (!id) return alert('错误：无法获取账单ID');
    const setVal = (eid, val) => { const el = document.getElementById(eid); if (el) el.value = val ? val : ''; };
    setVal('editBillId', id);
    setVal('editBillAmount', amount);
    setVal('editBillCategory', category);
    setVal('editBillDate', date);
    setVal('editBillDesc', desc);
    openModal('editBillModal');
};

window.triggerDeleteBill = function (id) {
    if (!id) return;
    pendingDeleteBillId = id;
    openModal('deleteBillModal');
};

window.submitEditBill = async function () {
    const id = document.getElementById('editBillId').value;
    if (!id) return alert('编辑 ID 丢失');

    const payload = {
        amount: parseFloat(document.getElementById('editBillAmount').value) || 0,
        category: document.getElementById('editBillCategory').value,
        date: document.getElementById('editBillDate').value,
        description: document.getElementById('editBillDesc').value
    };

    try {
        const result = await window.db.updateBill(id, payload);
        if (result.success) {
            window.closeModal('editBillModal');
            try { showToastModal('成功', '账单已更新'); } catch (e) { alert('账单已更新'); }
            loadBills(currentFilter);
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav && activeNav.textContent.includes('账单管理')) { activeNav.click(); }
            loadAccounts();
        } else {
            alert('更新失败：' + (result.error || '未知错误'));
        }
    } catch (error) {
        alert('更新失败: ' + error.message);
    }
};

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
    // 新建分类的确认按钮
    const createCatBtn = document.getElementById('confirmCreateCategoryBtn');
    if (createCatBtn) {
        createCatBtn.addEventListener('click', performCreateCategory);
    }
    // 绑定回车键确认
    const createCatInput = document.getElementById('newCategoryInputName');
    if (createCatInput) {
        createCatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performCreateCategory();
        });
    }

    // 删除确认按钮
    const confirmDeleteBtn = document.getElementById('confirmDeleteBill');
    if (confirmDeleteBtn) {
        const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
        confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
        newConfirmBtn.addEventListener('click', async () => {
            if (!pendingDeleteBillId) return;
            try {
                const result = await window.db.deleteBill(pendingDeleteBillId);
                if (result.success) {
                    window.closeModal('deleteBillModal');
                    pendingDeleteBillId = null;
                    try { showToastModal('成功', '账单已删除'); } catch (e) { alert('账单已删除'); }
                    loadBills(currentFilter);
                    const activeNav = document.querySelector('.nav-item-active');
                    if (activeNav && activeNav.textContent.includes('账单管理')) { activeNav.click(); }
                    loadAccounts();
                } else {
                    alert('删除失败：' + (result.error || '未知错误'));
                }
            } catch (error) {
                alert('无法删除: ' + error.message);
            }
        });
    }

    // 取消删除
    const cancelDeleteBtn = document.getElementById('cancelDeleteBill');
    if (cancelDeleteBtn) {
        const newCancelBtn = cancelDeleteBtn.cloneNode(true);
        cancelDeleteBtn.parentNode.replaceChild(newCancelBtn, cancelDeleteBtn);
        newCancelBtn.addEventListener('click', () => {
            pendingDeleteBillId = null;
            window.closeModal('deleteBillModal');
        });
    }

    // 表单提交
    const form = document.getElementById('bill-form');
    if (form) {
        form.removeEventListener('submit', handleBillFormSubmit);
        form.addEventListener('submit', handleBillFormSubmit);
    }

    loadFilterFromURL();
});

function loadFilterFromURL() {
    const params = new URLSearchParams(window.location.search);
    loadBills({
        type: params.get('type') || 'all',
        startDate: params.get('startDate') || '',
        endDate: params.get('endDate') || ''
    });
}

// 导出
window.switchBillType = switchBillType;
window.handleBillFormSubmit = handleBillFormSubmit;
window.initCategorySelection = initCategorySelection;
window.initQuickInputOptions = initQuickInputOptions;
window.loadBills = loadBills;
// views/bill.js - 账单管理 (支持筛选版)

import { showToastModal } from './modal.js';
import { loadAccounts } from './account.js';
import { renderCharts } from './stat.js';

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

// 快捷选项数据
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

export function initCategorySelection() {
    const items = document.querySelectorAll('.category-item');
    if (items.length === 0) return;

    items.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener('click', function () {
            document.querySelectorAll('.category-item').forEach(i => {
                i.classList.remove('selected', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
                i.classList.add('border-gray-200');
            });
            this.classList.remove('border-gray-200');
            this.classList.add('selected', 'border-indigo-500', 'bg-indigo-50', 'text-indigo-600');
            document.getElementById('billCategory').value = this.dataset.category;
        });
    });
}

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
    document.getElementById('billType').value = type;
    setTimeout(initCategorySelection, 100);
}

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

export function initQuickInputOptions() {
    const container = document.getElementById('quickInputOptions');
    if (!container) return;

    container.onclick = function (e) {
        const btn = e.target.closest('.quick-entry-btn');
        if (!btn) return;
        e.preventDefault();
        const amount = btn.dataset.amount;
        const category = btn.dataset.category;
        document.getElementById('billAmount').value = amount;
        const catItem = document.querySelector(`.category-item[data-category="${category}"]`);
        if (catItem) {
            const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
            catItem.dispatchEvent(clickEvent);
        }
    };
}

export async function handleBillFormSubmit(event) {
    event.preventDefault();
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    const amount = document.getElementById('billAmount').value;
    const accountId = document.getElementById('accountSelect').value;
    const date = document.getElementById('billDate').value;
    const category = document.getElementById('billCategory').value;
    const type = document.getElementById('billType').value;
    const description = document.getElementById('billDescription').value;

    if (!amount || amount <= 0) { showToastModal('提示', '请输入金额'); return; }
    if (!accountId) { showToastModal('提示', '请选择账户'); return; }
    if (!date) { showToastModal('提示', '请选择日期'); return; }
    if (!category) { showToastModal('提示', '请选择分类'); return; }

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
            showToastModal('成功', '账单已保存');
            document.getElementById('billAmount').value = '';
            document.getElementById('billDescription').value = '';
            loadBills();
            loadAccounts();
        } else {
            showToastModal('失败', result.error);
        }
    } catch (error) {
        showToastModal('错误', '网络错误: ' + error.message);
    }
}

/**
 * 【核心修改】loadBills 支持传入 filters
 * filters 格式: { startDate: '2024-01-01', endDate: '2024-01-31', type: 'expense' }
 */
export async function loadBills(filters = {}) {
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    try {
        // 合并用户ID和筛选条件
        const queryParams = {
            user_id: currentUser.userId,
            ...filters
        };

        const bills = await window.db.getBills(queryParams);

        const listContainer = document.getElementById('billList');
        if (listContainer) {
            listContainer.innerHTML = '';
            if (bills.length === 0) {
                listContainer.innerHTML = '<div class="text-center text-gray-400 py-4">暂无账单数据</div>';
            } else {
                bills.forEach(bill => {
                    const isExpense = bill.type === 'expense';
                    const colorClass = isExpense ? 'text-red-500' : 'text-green-500';
                    const sign = isExpense ? '-' : '+';

                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2';
                    div.innerHTML = `
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isExpense ? 'bg-red-100' : 'bg-green-100'}">
                                <i class="fas ${bill.type === 'expense' ? 'fa-shopping-bag' : 'fa-wallet'} ${colorClass}"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-800">${bill.category} <span class="text-xs text-gray-400 ml-2">${bill.date}</span></div>
                                <div class="text-xs text-gray-500">${bill.description}</div>
                            </div>
                        </div>
                        <div class="font-bold ${colorClass}">${sign}¥${parseFloat(bill.amount).toFixed(2)}</div>
                    `;
                    listContainer.appendChild(div);
                });
            }
        }

        // 仅在无筛选（默认加载）时更新统计卡片，防止筛选后统计数据错乱
        // 或者你可以选择筛选后也更新，取决于需求。这里简单处理，每次都更新。
        updateDashboardCards(bills);

        if (window.renderCharts) window.renderCharts(bills);

    } catch (error) {
        console.error("加载账单失败", error);
    }
}

function updateDashboardCards(bills) {
    let totalIncome = 0;
    let totalExpense = 0;

    bills.forEach(bill => {
        if (bill.type === 'income') {
            totalIncome += parseFloat(bill.amount);
        } else {
            totalExpense += parseFloat(bill.amount);
        }
    });

    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
    document.getElementById('totalExpense').textContent = totalExpense.toFixed(2);
    document.getElementById('totalBalance').textContent = balance.toFixed(2);
}

window.switchBillType = switchBillType;
window.handleBillFormSubmit = handleBillFormSubmit;
window.initCategorySelection = initCategorySelection;
window.initQuickInputOptions = initQuickInputOptions;
window.loadBills = loadBills;
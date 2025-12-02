// views/bill.js

import { showToastModal } from './modal.js';
import { loadAccounts } from './account.js';
import { renderCharts } from './stat.js';

// ... (分类数据保持不变，为了简洁我直接写在这里) ...
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

// --- 基础功能 ---

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
        } else {
            incomeBtn.classList.add('border-b-2', 'border-indigo-500', 'text-indigo-600');
            incomeBtn.classList.remove('text-gray-500');
            expenseBtn.classList.remove('border-b-2', 'border-indigo-500', 'text-indigo-600');
            expenseBtn.classList.add('text-gray-500');
            document.getElementById('expenseCategories').classList.add('hidden');
            document.getElementById('incomeCategories').classList.remove('hidden');
        }
    }
    document.getElementById('billType').value = type;
    setTimeout(initCategorySelection, 100);
}

export function initQuickInputOptions() {
    const container = document.getElementById('quickInputOptions');
    if (!container) return;
    container.onclick = function (e) {
        const btn = e.target.closest('.quick-entry-btn');
        if (!btn) return;
        e.preventDefault();
        document.getElementById('billAmount').value = btn.dataset.amount;
        const catItem = document.querySelector(`.category-item[data-category="${btn.dataset.category}"]`);
        if (catItem) {
            const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
            catItem.dispatchEvent(clickEvent);
        }
    };
}

// --- 记账 (新增) ---

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

    if (!amount) { showToastModal('提示', '请输入金额'); return; }
    if (!accountId) { showToastModal('提示', '请选择账户'); return; }
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

// --- 加载列表 (Read) ---

export async function loadBills(filters = {}) {
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) return;

    try {
        const queryParams = { user_id: currentUser.userId, ...filters };
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
        if (bill.type === 'income') totalIncome += parseFloat(bill.amount);
        else totalExpense += parseFloat(bill.amount);
    });
    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
    document.getElementById('totalExpense').textContent = totalExpense.toFixed(2);
    document.getElementById('totalBalance').textContent = (totalIncome - totalExpense).toFixed(2);
}

// --- 【新增】删除账单逻辑 ---

window.deleteBill = async function (billId) {
    if (!confirm('确定要删除这条账单吗？')) return;
    try {
        const result = await window.db.deleteBill(billId);
        if (result.success) {
            showToastModal('成功', '账单已删除');
            // 刷新当前页面
            // 如果在主页，刷新主页列表；如果在管理页，刷新管理页列表
            // 简单起见，重新点击一次当前的导航
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav) activeNav.click();
        } else {
            showToastModal('错误', result.error);
        }
    } catch (e) {
        showToastModal('错误', e.message);
    }
}

// --- 【新增】编辑账单逻辑 ---

window.openEditBillModal = function (id, amount, category, desc, date, type) {
    const modal = document.getElementById('editBillModal');
    if (!modal) return;

    // 填充数据
    document.getElementById('editBillId').value = id;
    document.getElementById('editBillAmount').value = amount;
    document.getElementById('editBillCategory').value = category;
    document.getElementById('editBillDate').value = date;
    document.getElementById('editBillDesc').value = desc;

    // 显示弹窗
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('editBillContent').classList.remove('scale-90', 'opacity-0');
    }, 10);
}

window.closeEditBillModal = function () {
    const modal = document.getElementById('editBillModal');
    const content = document.getElementById('editBillContent');
    if (!modal) return;

    content.classList.add('scale-90', 'opacity-0');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

window.submitEditBill = async function () {
    const id = document.getElementById('editBillId').value;
    const amount = document.getElementById('editBillAmount').value;
    const category = document.getElementById('editBillCategory').value;
    const date = document.getElementById('editBillDate').value;
    const desc = document.getElementById('editBillDesc').value;

    const data = {
        amount: parseFloat(amount),
        category: category,
        date: date,
        description: desc
    };

    try {
        const result = await window.db.updateBill(id, data);
        if (result.success) {
            showToastModal('成功', '账单已更新');
            window.closeEditBillModal();
            // 刷新列表
            const activeNav = document.querySelector('.nav-item-active');
            if (activeNav) activeNav.click();
        } else {
            showToastModal('错误', result.error);
        }
    } catch (e) {
        showToastModal('错误', e.message);
    }
}

// 导出
window.switchBillType = switchBillType;
window.handleBillFormSubmit = handleBillFormSubmit;
window.initCategorySelection = initCategorySelection;
window.initQuickInputOptions = initQuickInputOptions;
window.loadBills = loadBills;
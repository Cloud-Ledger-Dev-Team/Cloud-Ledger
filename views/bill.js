// 账单管理相关功能

// 导入模态框功能
import { showToastModal } from './modal.js';

// 导入账户管理功能
import { loadAccounts } from './account.js';

// 预定义的账单分类
export const expenseCategories = [
    { id: 1, name: '餐饮', icon: 'fas fa-utensils' },
    { id: 2, name: '交通', icon: 'fas fa-car' },
    { id: 3, name: '购物', icon: 'fas fa-shopping-cart' },
    { id: 4, name: '娱乐', icon: 'fas fa-film' },
    { id: 5, name: '医疗', icon: 'fas fa-stethoscope' },
    { id: 6, name: '教育', icon: 'fas fa-graduation-cap' },
    { id: 7, name: '住房', icon: 'fas fa-home' },
    { id: 8, name: '其他支出', icon: 'fas fa-ellipsis-h' }
];

export const incomeCategories = [
    { id: 101, name: '工资', icon: 'fas fa-money-bill-wave' },
    { id: 102, name: '奖金', icon: 'fas fa-gift' },
    { id: 103, name: '投资收益', icon: 'fas fa-chart-line' },
    { id: 104, name: '兼职收入', icon: 'fas fa-briefcase' },
    { id: 105, name: '其他收入', icon: 'fas fa-ellipsis-h' }
];

/**
 * 切换账单类型（支出/收入）
 * @param {string} type - 账单类型（expense/income）
 */
export function switchBillType(type) {
    // 更新选中状态
    document.getElementById('expenseType').classList.toggle('active', type === 'expense');
    document.getElementById('incomeType').classList.toggle('active', type === 'income');
    
    // 更新分类列表
    const categoryContainer = document.getElementById('billCategories');
    if (!categoryContainer) return;
    
    // 清空现有分类
    categoryContainer.innerHTML = '';
    
    // 获取对应类型的分类
    const categories = type === 'expense' ? expenseCategories : incomeCategories;
    
    // 添加分类选项
    categories.forEach(category => {
        const categoryOption = document.createElement('div');
        categoryOption.className = 'category-option p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-500';
        categoryOption.dataset.categoryId = category.id;
        categoryOption.dataset.categoryName = category.name;
        
        // 分类图标
        const icon = document.createElement('i');
        icon.className = `${category.icon} text-gray-600 mb-1`;
        
        // 分类名称
        const name = document.createElement('span');
        name.className = 'block text-sm';
        name.textContent = category.name;
        
        categoryOption.appendChild(icon);
        categoryOption.appendChild(name);
        
        // 添加点击事件
        categoryOption.addEventListener('click', function() {
            // 移除其他选中状态
            document.querySelectorAll('.category-option').forEach(opt => {
                opt.classList.remove('border-blue-500', 'bg-blue-50');
            });
            // 添加选中状态
            this.classList.add('border-blue-500', 'bg-blue-50');
            // 设置隐藏字段值
            document.getElementById('billCategoryId').value = category.id;
            document.getElementById('billCategoryName').value = category.name;
        });
        
        categoryContainer.appendChild(categoryOption);
    });
}

/**
 * 初始化快捷录入选项
 */
export function initQuickInputOptions() {
    const quickInputContainer = document.getElementById('quickInputOptions');
    if (!quickInputContainer) return;
    
    // 快捷金额选项
    const quickAmounts = [10, 20, 50, 100, 200, 500];
    
    quickAmounts.forEach(amount => {
        const amountOption = document.createElement('button');
        amountOption.className = 'quick-amount-btn px-4 py-2 rounded-lg border transition-all hover:border-blue-500';
        amountOption.textContent = `¥${amount}`;
        
        // 添加点击事件
        amountOption.addEventListener('click', function() {
            document.getElementById('billAmount').value = amount;
        });
        
        quickInputContainer.appendChild(amountOption);
    });
}

/**
 * 验证账单表单
 * @returns {boolean} - 表单是否有效
 */
export function validateBillForm() {
    // 获取表单数据
    const amount = parseFloat(document.getElementById('billAmount').value);
    const categoryId = document.getElementById('billCategoryId').value;
    const accountId = document.getElementById('billAccount').value;
    const date = document.getElementById('billDate').value;
    const remark = document.getElementById('billRemark').value;
    
    // 隐藏所有错误提示
    hideError('billAmountError');
    hideError('billCategoryError');
    hideError('billAccountError');
    hideError('billDateError');
    
    // 表单验证
    let isValid = true;
    
    // 金额验证
    if (isNaN(amount) || amount <= 0) {
        showError('billAmountError', '请输入有效的金额');
        isValid = false;
    }
    
    // 分类验证
    if (!categoryId) {
        showError('billCategoryError', '请选择分类');
        isValid = false;
    }
    
    // 账户验证
    if (!accountId) {
        showError('billAccountError', '请选择账户');
        isValid = false;
    }
    
    // 日期验证
    if (!date) {
        showError('billDateError', '请选择日期');
        isValid = false;
    }
    
    return isValid;
}

/**
 * 提交账单表单
 * @param {Event} event - 表单提交事件
 */
export function handleBillFormSubmit(event) {
    event.preventDefault();
    console.log('账单表单提交');
    
    // 验证表单
    if (!validateBillForm()) {
        return;
    }
    
    // 获取表单数据
    const type = document.getElementById('expenseType').classList.contains('active') ? 'expense' : 'income';
    const amount = parseFloat(document.getElementById('billAmount').value);
    const categoryId = parseInt(document.getElementById('billCategoryId').value);
    const categoryName = document.getElementById('billCategoryName').value;
    const accountId = parseInt(document.getElementById('billAccount').value);
    const date = document.getElementById('billDate').value;
    const remark = document.getElementById('billRemark').value;
    
    // 创建账单对象
    const bill = {
        id: Date.now(), // 使用时间戳作为临时ID
        type,
        amount,
        categoryId,
        categoryName,
        accountId,
        date,
        remark,
        createdAt: new Date().toISOString()
    };
    
    // 从localStorage获取现有账单数据
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    
    // 添加新账单
    bills.push(bill);
    
    // 保存到localStorage
    localStorage.setItem('bills', JSON.stringify(bills));
    
    // 清空表单
    document.getElementById('billForm').reset();
    
    // 恢复默认选中状态
    switchBillType('expense');
    document.getElementById('billDate').valueAsDate = new Date();
    
    // 显示成功消息
    showToastModal('成功', '账单已添加');
    
    // 刷新账单列表
    loadBills();
}

/**
 * 加载账单列表
 */
export function loadBills() {
    // 模拟API请求加载账单数据
    console.log('加载账单列表');
    
    // 从localStorage获取账单数据
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    
    // 按日期降序排序
    bills.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 更新账单列表显示
    renderBillList(bills);
    
    return bills;
}

/**
 * 渲染账单列表
 * @param {Array} bills - 账单数据数组
 */
function renderBillList(bills) {
    const billListElement = document.getElementById('billList');
    if (!billListElement) return;
    
    // 清空现有列表
    billListElement.innerHTML = '';
    
    if (bills.length === 0) {
        // 显示空状态
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-10';
        emptyState.innerHTML = `
            <i class="fas fa-file-invoice-dollar text-gray-400 text-4xl mb-3"></i>
            <p class="text-gray-500">暂无账单记录</p>
        `;
        billListElement.appendChild(emptyState);
        return;
    }
    
    // 按日期分组
    const billsByDate = bills.reduce((groups, bill) => {
        const date = bill.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(bill);
        return groups;
    }, {});
    
    // 为每个日期分组创建列表项
    Object.keys(billsByDate).forEach(date => {
        // 日期标题
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-t-lg';
        dateHeader.textContent = formatDate(date);
        
        // 日期分组容器
        const dateGroup = document.createElement('div');
        dateGroup.className = 'bill-group mb-4 bg-white rounded-lg shadow-sm';
        
        dateGroup.appendChild(dateHeader);
        
        // 该日期的账单列表
        const dailyBills = document.createElement('div');
        dailyBills.className = 'daily-bills';
        
        // 计算当天收支总额
        let dailyIncome = 0;
        let dailyExpense = 0;
        
        // 添加每个账单项
        billsByDate[date].forEach(bill => {
            // 统计金额
            if (bill.type === 'income') {
                dailyIncome += bill.amount;
            } else {
                dailyExpense += bill.amount;
            }
            
            const billItem = document.createElement('div');
            billItem.className = 'bill-item p-4 border-b last:border-b-0';
            billItem.dataset.billId = bill.id;
            
            // 左侧：分类图标和名称
            const leftSection = document.createElement('div');
            leftSection.className = 'flex items-center';
            
            // 分类图标
            const categoryIcon = document.createElement('i');
            const category = (bill.type === 'expense' ? expenseCategories : incomeCategories).find(c => c.id === bill.categoryId);
            categoryIcon.className = `${category?.icon || 'fas fa-tag'} text-gray-600 mr-3 text-lg`;
            
            // 分类名称
            const categoryName = document.createElement('span');
            categoryName.className = 'category-name';
            categoryName.textContent = bill.categoryName;
            
            // 备注
            if (bill.remark) {
                const remark = document.createElement('div');
                remark.className = 'remark text-sm text-gray-500';
                remark.textContent = bill.remark;
                leftSection.appendChild(remark);
            }
            
            leftSection.appendChild(categoryIcon);
            leftSection.appendChild(categoryName);
            
            // 右侧：金额
            const rightSection = document.createElement('div');
            rightSection.className = `amount font-bold ${bill.type === 'income' ? 'text-green-600' : 'text-red-600'}`;
            rightSection.textContent = bill.type === 'income' ? `+¥${bill.amount.toFixed(2)}` : `-¥${bill.amount.toFixed(2)}`;
            
            billItem.appendChild(leftSection);
            billItem.appendChild(rightSection);
            
            dailyBills.appendChild(billItem);
        });
        
        // 添加当天总计
        const dailySummary = document.createElement('div');
        dailySummary.className = 'daily-summary p-4 bg-gray-50 rounded-b-lg';
        dailySummary.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-gray-600">收入</span>
                <span class="text-green-600 font-medium">+¥${dailyIncome.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center mt-1">
                <span class="text-gray-600">支出</span>
                <span class="text-red-600 font-medium">-¥${dailyExpense.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center mt-2 pt-2 border-t">
                <span class="font-medium">结余</span>
                <span class="font-bold text-gray-800">¥${(dailyIncome - dailyExpense).toFixed(2)}</span>
            </div>
        `;
        
        dateGroup.appendChild(dailyBills);
        dateGroup.appendChild(dailySummary);
        
        billListElement.appendChild(dateGroup);
    });
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串（YYYY-MM-DD）
 * @returns {string} - 格式化后的日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 检查是否是今天
    if (date.toDateString() === today.toDateString()) {
        return '今天';
    }
    
    // 检查是否是昨天
    if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    }
    
    // 格式化其他日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    
    return `${month}月${day}日 ${weekDay}`;
}
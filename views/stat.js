// 统计相关功能

/**
 * 加载月度统计数据
 * @param {string} year - 年份
 * @param {string} month - 月份
 */
export function loadMonthlyStats(year, month) {
    // 确保参数格式正确
    const targetYear = year || new Date().getFullYear().toString();
    const targetMonth = month || String(new Date().getMonth() + 1).padStart(2, '0');
    
    console.log(`加载${targetYear}年${targetMonth}月的统计数据`);
    
    // 从localStorage获取账单数据
    const bills = JSON.parse(localStorage.getItem('bills') || '[]');
    
    // 过滤出目标月份的账单
    const monthStart = new Date(`${targetYear}-${targetMonth}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const monthlyBills = bills.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= monthStart && billDate < monthEnd;
    });
    
    // 计算收支总额
    const stats = calculateMonthlyStats(monthlyBills);
    
    // 更新统计数据显示
    updateMonthlyStatsDisplay(stats, targetYear, targetMonth);
    
    // 绘制图表
    drawExpenseChart(stats.expenseByCategory);
    drawIncomeChart(stats.incomeByCategory);
    drawDailyTrendChart(stats.dailyTrend);
    
    return stats;
}

/**
 * 计算月度统计数据
 * @param {Array} monthlyBills - 月度账单数据
 * @returns {Object} - 统计数据对象
 */
function calculateMonthlyStats(monthlyBills) {
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 按分类统计收支
    const expenseByCategory = {};
    const incomeByCategory = {};
    
    // 按日统计收支趋势
    const dailyTrend = {};
    
    // 处理每一笔账单
    monthlyBills.forEach(bill => {
        const { type, amount, categoryName, date } = bill;
        const day = date.split('-')[2];
        
        // 统计总额
        if (type === 'income') {
            totalIncome += amount;
            
            // 按分类统计收入
            if (!incomeByCategory[categoryName]) {
                incomeByCategory[categoryName] = 0;
            }
            incomeByCategory[categoryName] += amount;
        } else {
            totalExpense += amount;
            
            // 按分类统计支出
            if (!expenseByCategory[categoryName]) {
                expenseByCategory[categoryName] = 0;
            }
            expenseByCategory[categoryName] += amount;
        }
        
        // 按日统计趋势
        if (!dailyTrend[day]) {
            dailyTrend[day] = { income: 0, expense: 0 };
        }
        dailyTrend[day][type] += amount;
    });
    
    // 计算结余
    const balance = totalIncome - totalExpense;
    
    return {
        totalIncome,
        totalExpense,
        balance,
        expenseByCategory,
        incomeByCategory,
        dailyTrend
    };
}

/**
 * 更新月度统计数据显示
 * @param {Object} stats - 统计数据
 * @param {string} year - 年份
 * @param {string} month - 月份
 */
function updateMonthlyStatsDisplay(stats, year, month) {
    // 更新标题
    const titleElement = document.getElementById('statsTitle');
    if (titleElement) {
        titleElement.textContent = `${year}年${month}月统计`;
    }
    
    // 更新收入总额
    const incomeElement = document.getElementById('totalIncome');
    if (incomeElement) {
        incomeElement.textContent = `¥${stats.totalIncome.toFixed(2)}`;
    }
    
    // 更新支出总额
    const expenseElement = document.getElementById('totalExpense');
    if (expenseElement) {
        expenseElement.textContent = `¥${stats.totalExpense.toFixed(2)}`;
    }
    
    // 更新结余
    const balanceElement = document.getElementById('monthlyBalance');
    if (balanceElement) {
        balanceElement.textContent = `¥${stats.balance.toFixed(2)}`;
        
        // 根据结余正负设置样式
        if (stats.balance >= 0) {
            balanceElement.className = 'font-bold text-green-600';
        } else {
            balanceElement.className = 'font-bold text-red-600';
        }
    }
    
    // 更新支出分类列表
    updateCategoryList('expenseCategoryList', stats.expenseByCategory, stats.totalExpense);
    
    // 更新收入分类列表
    updateCategoryList('incomeCategoryList', stats.incomeByCategory, stats.totalIncome);
}

/**
 * 更新分类列表显示
 * @param {string} elementId - 元素ID
 * @param {Object} categoryData - 分类数据
 * @param {number} total - 总额
 */
function updateCategoryList(elementId, categoryData, total) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    if (Object.keys(categoryData).length === 0) {
        // 显示空状态
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-5 text-gray-500';
        emptyState.textContent = '暂无数据';
        container.appendChild(emptyState);
        return;
    }
    
    // 转换为数组并按金额降序排序
    const sortedCategories = Object.entries(categoryData)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
    
    // 添加每个分类项
    sortedCategories.forEach(({ name, amount }) => {
        const percentage = total > 0 ? (amount / total * 100).toFixed(1) : '0.0';
        
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-stat-item flex items-center mb-3';
        
        // 分类名称
        const categoryName = document.createElement('span');
        categoryName.className = 'category-name flex-1';
        categoryName.textContent = name;
        
        // 统计信息
        const categoryStats = document.createElement('div');
        categoryStats.className = 'category-stats text-right';
        
        // 金额
        const categoryAmount = document.createElement('div');
        categoryAmount.className = 'category-amount font-medium';
        categoryAmount.textContent = `¥${amount.toFixed(2)}`;
        
        // 百分比
        const categoryPercentage = document.createElement('div');
        categoryPercentage.className = 'category-percentage text-sm text-gray-500';
        categoryPercentage.textContent = `${percentage}%`;
        
        categoryStats.appendChild(categoryAmount);
        categoryStats.appendChild(categoryPercentage);
        
        categoryItem.appendChild(categoryName);
        categoryItem.appendChild(categoryStats);
        
        container.appendChild(categoryItem);
    });
}

/**
 * 绘制支出饼图
 * @param {Object} expenseByCategory - 按分类统计的支出数据
 */
function drawExpenseChart(expenseByCategory) {
    // 这里应该使用Chart.js等库来绘制图表
    // 由于没有实际引入Chart.js，这里只做简单的显示
    const chartContainer = document.getElementById('expenseChart');
    if (!chartContainer) return;
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    if (Object.keys(expenseByCategory).length === 0) {
        // 显示空状态
        chartContainer.innerHTML = '<div class="text-center py-10 text-gray-500">暂无支出数据</div>';
        return;
    }
    
    // 简化的图表实现（实际项目中应使用图表库）
    // 创建简单的饼图占位符
    chartContainer.innerHTML = `<div class="text-center py-8">
        <i class="fas fa-chart-pie text-gray-400 text-3xl mb-2"></i>
        <p>支出分类占比图表</p>
        <p class="text-sm text-gray-500">（实际项目中应使用Chart.js等库绘制）</p>
    </div>`;
    
    console.log('支出分类数据:', expenseByCategory);
}

/**
 * 绘制收入饼图
 * @param {Object} incomeByCategory - 按分类统计的收入数据
 */
function drawIncomeChart(incomeByCategory) {
    // 这里应该使用Chart.js等库来绘制图表
    // 由于没有实际引入Chart.js，这里只做简单的显示
    const chartContainer = document.getElementById('incomeChart');
    if (!chartContainer) return;
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    if (Object.keys(incomeByCategory).length === 0) {
        // 显示空状态
        chartContainer.innerHTML = '<div class="text-center py-10 text-gray-500">暂无收入数据</div>';
        return;
    }
    
    // 简化的图表实现（实际项目中应使用图表库）
    // 创建简单的饼图占位符
    chartContainer.innerHTML = `<div class="text-center py-8">
        <i class="fas fa-chart-pie text-gray-400 text-3xl mb-2"></i>
        <p>收入分类占比图表</p>
        <p class="text-sm text-gray-500">（实际项目中应使用Chart.js等库绘制）</p>
    </div>`;
    
    console.log('收入分类数据:', incomeByCategory);
}

/**
 * 绘制日趋势图
 * @param {Object} dailyTrend - 按日统计的趋势数据
 */
function drawDailyTrendChart(dailyTrend) {
    // 这里应该使用Chart.js等库来绘制图表
    // 由于没有实际引入Chart.js，这里只做简单的显示
    const chartContainer = document.getElementById('dailyTrendChart');
    if (!chartContainer) return;
    
    // 清空容器
    chartContainer.innerHTML = '';
    
    if (Object.keys(dailyTrend).length === 0) {
        // 显示空状态
        chartContainer.innerHTML = '<div class="text-center py-10 text-gray-500">暂无数据</div>';
        return;
    }
    
    // 简化的图表实现（实际项目中应使用图表库）
    // 创建简单的趋势图占位符
    chartContainer.innerHTML = `<div class="text-center py-8">
        <i class="fas fa-chart-line text-gray-400 text-3xl mb-2"></i>
        <p>每日收支趋势图表</p>
        <p class="text-sm text-gray-500">（实际项目中应使用Chart.js等库绘制）</p>
    </div>`;
    
    console.log('每日趋势数据:', dailyTrend);
}
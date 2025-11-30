// views/stat.js - 统计图表核心逻辑

let categoryChartInstance = null; // 主页图表实例
let analysisChartInstance = null; // 分析页图表实例

/**
 * 【修复】主页小图表渲染函数 (供 bill.js 调用)
 */
export function renderCharts(bills) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return; // 如果找不到元素（比如在非主页），直接退出

    // 1. 筛选支出
    const expenses = bills.filter(b => b.type === 'expense');
    if (expenses.length === 0) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        return;
    }

    // 2. 汇总数据
    const categoryTotals = {};
    expenses.forEach(bill => {
        if (!categoryTotals[bill.category]) categoryTotals[bill.category] = 0;
        categoryTotals[bill.category] += parseFloat(bill.amount);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // 3. 绘图
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 10, font: { size: 10 } }
                }
            }
        }
    });
}

/**
 * 数据分析页大图表渲染函数 (供 cloud_ledger.html 调用)
 */
export function renderAnalysisPage(bills) {
    const ctx = document.getElementById('analysisChart');
    if (!ctx) return;

    if (!bills || bills.length === 0) {
        showEmptyState();
        return;
    }

    const expenses = bills.filter(b => b.type === 'expense');
    if (expenses.length === 0) {
        showEmptyState();
        return;
    }

    // 数据处理
    const categoryMap = {};
    let totalExpense = 0;
    expenses.forEach(bill => {
        const amount = parseFloat(bill.amount);
        if (!categoryMap[bill.category]) categoryMap[bill.category] = 0;
        categoryMap[bill.category] += amount;
        totalExpense += amount;
    });

    const sortedData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 绘图
    const labels = sortedData.map(d => d.name);
    const values = sortedData.map(d => d.value);
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (analysisChartInstance) analysisChartInstance.destroy();

    analysisChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%'
        }
    });

    // 渲染排行榜
    renderRankingList(sortedData, totalExpense);
}

function renderRankingList(data, total) {
    const container = document.getElementById('analysisRanking');
    if (!container) return;

    let html = '';
    data.forEach((item, index) => {
        const percent = ((item.value / total) * 100).toFixed(1);
        const colorClass = index < 3 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 bg-gray-100';
        html += `
            <div class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${colorClass}">${index + 1}</span>
                    <span class="font-medium text-gray-700">${item.name}</span>
                </div>
                <div class="text-right">
                    <div class="font-bold text-gray-800">¥${item.value.toFixed(2)}</div>
                    <div class="text-xs text-gray-400">${percent}%</div>
                </div>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-1.5 mb-1 mt-1">
                <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showEmptyState() {
    const chartContainer = document.getElementById('analysisChart')?.parentElement;
    const rankContainer = document.getElementById('analysisRanking');
    if (chartContainer) chartContainer.innerHTML = '<div class="text-gray-400 flex items-center justify-center h-full">暂无数据</div>';
    if (rankContainer) rankContainer.innerHTML = '<div class="text-center text-gray-400 py-10">暂无数据</div>';
}

// 暴露给全局
window.renderCharts = renderCharts;
window.renderAnalysisPage = renderAnalysisPage;
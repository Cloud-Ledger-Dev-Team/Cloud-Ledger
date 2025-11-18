// API测试脚本
// 用于验证前端与后端的API连接和数据操作功能

// 测试结果存储
const testResults = {
    loginStatus: null,
    billApi: null,
    accountApi: null,
    statsApi: null,
    overallStatus: 'pending'
};

// 已移除API测试结果弹窗相关函数
function addTestResultDisplay() {
    // 函数保留但不执行任何操作
    console.log('API测试结果弹窗已禁用');
}

function updateTestResultsDisplay() {
    // 函数保留但不执行任何操作
    console.log('API测试结果显示已禁用');
}

// 等待DOM完全加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addTestResultDisplay();
        initApiTests();
    });
} else {
    addTestResultDisplay();
    initApiTests();
}

function initApiTests() {
    console.log('开始API连接测试...');
    
    // 检查登录状态
    checkLoginStatus();
    
    // 等待一段时间确保登录状态设置完成
    setTimeout(() => {
        // 测试账单相关API
        testBillApi();
        
        // 测试账户相关API
        testAccountApi();
        
        // 测试统计数据API
        testStatsApi();
    }, 2000);
}

// 检查当前登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    console.log('\n===== 登录状态检查 =====');
    console.log('是否登录:', !!token);
    console.log('用户ID:', userId);
    console.log('用户名:', username);
    console.log('Token:', token);
    
    // 更新登录状态
    testResults.loginStatus = !!token;
    updateTestResultsDisplay();
}

// 测试账单相关API
async function testBillApi() {
    console.log('\n===== 账单API测试 =====');
    
    try {
        // 1. 获取账单列表
        console.log('1. 获取账单列表...');
        const bills = await window.db.getBills();
        console.log('获取账单列表成功:', bills);
        
        // 2. 添加新账单
        console.log('\n2. 添加新账单...');
        const newBill = {
            amount: 100.50,
            category: '餐饮',
            date: new Date().toISOString().split('T')[0],
            description: '测试账单',
            type: 'expense'
        };
        const addedBill = await window.db.addBill(newBill);
        console.log('添加账单成功:', addedBill);
        
        // 如果成功添加了账单，可以尝试更新和删除操作
        if (addedBill && addedBill.id) {
            // 3. 更新账单
            console.log('\n3. 更新账单...');
            const updatedBill = {
                ...newBill,
                amount: 120.75,
                description: '更新后的测试账单'
            };
            const result = await window.db.updateBill(addedBill.id, updatedBill);
            console.log('更新账单成功:', result);
            
            // 4. 获取单个账单详情
            console.log('\n4. 获取单个账单详情...');
            const billDetail = await window.db.getBillById(addedBill.id);
            console.log('获取账单详情成功:', billDetail);
            
            // 5. 删除账单
            console.log('\n5. 删除账单...');
            const deleteResult = await window.db.deleteBill(addedBill.id);
            console.log('删除账单成功:', deleteResult);
        }
        
        console.log('\n账单API测试完成！');
        // 更新测试结果为成功
        testResults.billApi = true;
    } catch (error) {
        console.error('账单API测试失败:', error);
        // 更新测试结果为失败
        testResults.billApi = false;
    } finally {
        // 更新测试结果显示
        updateTestResultsDisplay();
    }
}

// 测试账户相关API
async function testAccountApi() {
    console.log('\n===== 账户API测试 =====');
    
    try {
        // 1. 获取账户列表
        console.log('1. 获取账户列表...');
        const accounts = await window.db.getAccounts();
        console.log('获取账户列表成功:', accounts);
        
        // 2. 添加新账户
        console.log('\n2. 添加新账户...');
        const newAccount = {
            name: '测试账户',
            balance: 5000,
            type: 'cash'
        };
        const addedAccount = await window.db.addAccount(newAccount);
        console.log('添加账户成功:', addedAccount);
        
        // 如果成功添加了账户，可以尝试更新和删除操作
        if (addedAccount && addedAccount.id) {
            // 3. 更新账户
            console.log('\n3. 更新账户...');
            const updatedAccount = {
                ...newAccount,
                balance: 6000,
                name: '更新后的测试账户'
            };
            const result = await window.db.updateAccount(addedAccount.id, updatedAccount);
            console.log('更新账户成功:', result);
            
            // 4. 删除账户
            console.log('\n4. 删除账户...');
            const deleteResult = await window.db.deleteAccount(addedAccount.id);
            console.log('删除账户成功:', deleteResult);
        }
        
        console.log('\n账户API测试完成！');
        // 更新测试结果为成功
        testResults.accountApi = true;
    } catch (error) {
        console.error('账户API测试失败:', error);
        // 更新测试结果为失败
        testResults.accountApi = false;
    } finally {
        // 更新测试结果显示
        updateTestResultsDisplay();
    }
}

// 测试统计数据API
async function testStatsApi() {
    console.log('\n===== 统计数据API测试 =====');
    
    try {
        // 1. 获取月度统计
        console.log('1. 获取月度统计...');
        const monthlyStats = await window.db.getMonthlyStats();
        console.log('获取月度统计成功:', monthlyStats);
        
        // 2. 获取支出趋势
        console.log('\n2. 获取支出趋势...');
        const expenseTrend = await window.db.getExpenseTrend();
        console.log('获取支出趋势成功:', expenseTrend);
        
        // 3. 获取预算信息
        console.log('\n3. 获取预算信息...');
        const budget = await window.db.getBudget();
        console.log('获取预算信息成功:', budget);
        
        console.log('\n统计数据API测试完成！');
        // 更新测试结果为成功
        testResults.statsApi = true;
    } catch (error) {
        console.error('统计数据API测试失败:', error);
        // 更新测试结果为失败
        testResults.statsApi = false;
    } finally {
        // 更新测试结果显示
        updateTestResultsDisplay();
        
        // 所有测试完成后，更新总体状态
        testResults.overallStatus = 'completed';
    }
}
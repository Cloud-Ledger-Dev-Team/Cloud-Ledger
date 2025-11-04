// 数据库名称和版本
// 后端API基础URL
const API_BASE_URL = 'http://localhost:5000/api';

// 模拟数据 - 由于是前端演示，我们不实际发送API请求
// 模拟用户数据库
const mockUsers = [
    { id: '1', name: '张三', email: 'zhangsan@example.com', password: 'password123' },
    { id: '2', name: '李四', email: 'lisi@example.com', password: 'password456' }
];

// 模拟账单数据
const mockBills = [
    { bill_id: '1', user_id: '1', account_id: '1', amount: 100, type: '支出', category: '餐饮', date: '2023-10-01', description: '午餐' },
    { bill_id: '2', user_id: '1', account_id: '2', amount: 500, type: '收入', category: '工资', date: '2023-10-05', description: '月工资' }
];

// 模拟账户数据
const mockAccounts = [
    { account_id: '1', user_id: '1', name: '现金', type: '现金', balance: 1000.00 },
    { account_id: '2', user_id: '1', name: '银行卡', type: '银行卡', balance: 5000.00 }
];

// 通用API请求函数 - 模拟版本
async function apiRequest(endpoint, method = 'GET', data = null) {
    // 返回一个Promise，模拟网络延迟
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // 根据不同的端点模拟不同的响应
                if (endpoint === '/users/login' && method === 'POST') {
                    // 模拟登录成功
                    const user = mockUsers.find(u => u.email === data.email && u.password === data.password);
                    if (user) {
                        resolve({
                            token: `mock-token-${user.id}`,
                            user_id: user.id,
                            username: user.name
                        });
                    } else {
                        reject(new Error('邮箱或密码错误'));
                    }
                } else if (endpoint === '/users/register' && method === 'POST') {
                    // 模拟注册成功
                    const newUserId = (mockUsers.length + 1).toString();
                    mockUsers.push({
                        id: newUserId,
                        name: data.name,
                        email: data.email,
                        password: data.password
                    });
                    resolve({
                        message: '注册成功'
                    });
                } else if (endpoint === '/users/forgot-password' && method === 'POST') {
                    // 模拟忘记密码请求
                    const user = mockUsers.find(u => u.email === data.email);
                    if (user) {
                        resolve({
                            message: '重置密码链接已发送到您的邮箱'
                        });
                    } else {
                        reject(new Error('该邮箱未注册'));
                    }
                } else if (endpoint === '/accounts' && method === 'GET') {
                    // 模拟获取账户列表
                    const userId = localStorage.getItem('user_id');
                    const userAccounts = mockAccounts.filter(a => a.user_id === userId);
                    resolve({ accounts: userAccounts });
                } else if (endpoint === '/bills' && method === 'GET') {
                    // 模拟获取账单列表
                    const userId = localStorage.getItem('user_id');
                    const userBills = mockBills.filter(b => b.user_id === userId);
                    resolve(userBills);
                } else if (endpoint.startsWith('/accounts/') && method === 'DELETE') {
                    // 模拟删除账户
                    resolve({ message: '账户删除成功' });
                } else if (endpoint === '/bills' && method === 'POST') {
                    // 模拟添加账单
                    const newBillId = (mockBills.length + 1).toString();
                    const newBill = {
                        bill_id: newBillId,
                        user_id: localStorage.getItem('user_id'),
                        ...data
                    };
                    mockBills.push(newBill);
                    resolve(newBill);
                } else {
                    // 对于其他端点，返回一个默认成功响应
                    resolve({ message: '请求成功' });
                }
            } catch (error) {
                reject(error);
            }
        }, 500); // 模拟500ms的网络延迟
    });
}

// ====================== 用户模块 ======================

// 用户登录
async function login(email, password) {
    try {
        const result = await apiRequest('/users/login', 'POST', { email, password });
        // 存储JWT令牌和用户信息
        localStorage.setItem('token', result.token);
        localStorage.setItem('user_id', result.user_id);
        localStorage.setItem('username', result.username);
        localStorage.setItem('user_email', email); // 保存用户邮箱
        return result;
    } catch (error) {
        throw error;
    }
}

// 用户注册
async function register(userData) {
    try {
        const result = await apiRequest('/users/register', 'POST', userData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取当前登录用户信息
function getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    
    if (userId && token) {
        return {
            userId: userId,
            username: username,
            token: token
        };
    }
    return null;
}

// 用户登出
// 登出功能
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_email');
    localStorage.removeItem('currentUser'); // 为了向后兼容保留
}

// 忘记密码请求
async function forgotPassword(email) {
    try {
        const result = await apiRequest('/users/forgot-password', 'POST', { email });
        return result;
    } catch (error) {
        throw error;
    }
}

// 更新用户信息
async function updateUser(userId, userData) {
    try {
        const result = await apiRequest(`/users/${userId}`, 'PUT', userData);
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 账单模块 ======================

// 添加账单
async function addBill(billData) {
    try {
        const result = await apiRequest('/bills', 'POST', billData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取账单列表
async function getBills(filters = {}) {
    try {
        // 构建查询参数
        let queryParams = '';
        if (filters.type) queryParams += `&type=${filters.type}`;
        if (filters.category) queryParams += `&category=${filters.category}`;
        if (filters.startDate) queryParams += `&startDate=${filters.startDate}`;
        if (filters.endDate) queryParams += `&endDate=${filters.endDate}`;
        
        // 移除第一个&符号
        if (queryParams) queryParams = '?' + queryParams.substring(1);
        
        const result = await apiRequest(`/bills${queryParams}`, 'GET');
        return result.bills;
    } catch (error) {
        throw error;
    }
}

// 获取单条账单
async function getBillById(billId) {
    try {
        const result = await apiRequest(`/bills/${billId}`, 'GET');
        return result.bill;
    } catch (error) {
        throw error;
    }
}

// 更新账单
async function updateBill(billId, billData) {
    try {
        const result = await apiRequest(`/bills/${billId}`, 'PUT', billData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 删除账单
async function deleteBill(billId) {
    try {
        const result = await apiRequest(`/bills/${billId}`, 'DELETE');
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 预算模块 ======================

// 设置预算
async function setBudget(budgetData) {
    try {
        const result = await apiRequest('/budgets', 'POST', budgetData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取预算
async function getBudget(yearMonth) {
    try {
        const params = yearMonth ? `?year_month=${yearMonth}` : '';
        const result = await apiRequest(`/budgets${params}`, 'GET');
        return result.budget || null;
    } catch (error) {
        throw error;
    }
}

// ====================== 数据分析模块 ======================

// 获取月度收支统计
async function getMonthlyStats(month) {
    try {
        const result = await apiRequest(`/stats/monthly?year_month=${month}`, 'GET');
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取支出趋势
async function getExpenseTrend(months = 6) {
    try {
        const result = await apiRequest(`/stats/trend?months=${months}`, 'GET');
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 账户模块 ======================

// 获取账户列表
async function getAccounts() {
    try {
        const result = await apiRequest('/accounts', 'GET');
        return result.accounts;
    } catch (error) {
        throw error;
    }
}

// 添加账户
async function addAccount(accountData) {
    try {
        const result = await apiRequest('/accounts', 'POST', accountData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 更新账户
async function updateAccount(accountId, accountData) {
    try {
        const result = await apiRequest(`/accounts/${accountId}`, 'PUT', accountData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 删除账户
async function deleteAccount(accountId) {
    try {
        const result = await apiRequest(`/accounts/${accountId}`, 'DELETE');
        return result;
    } catch (error) {
        throw error;
    }
}

// 导出数据库API
window.db = {
    // 用户模块
    login,
    register,
    getCurrentUser,
    logout,
    updateUser,
    
    // 账单模块
    addBill,
    getBills,
    getBillById,
    updateBill,
    deleteBill,
    
    // 预算模块
    setBudget,
    getBudget,
    
    // 数据分析模块
    getMonthlyStats,
    getExpenseTrend,
    
    // 账户模块
    getAccounts,
    addAccount,
    updateAccount,
    deleteAccount
};
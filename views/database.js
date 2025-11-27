// 数据库连接和API对接
// 后端API基础URL
const API_BASE_URL = 'http://localhost:5000';
console.log('Database.js - API_BASE_URL设置为:', API_BASE_URL);

// API请求函数 - 生产环境版本
async function apiRequest(endpoint, method = 'GET', data = null) {
    // 构建完整URL
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    console.log(`[API] 发送请求: ${method} ${fullUrl}`);
    
    // 请求配置
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',  // 允许跨域请求
        credentials: 'include'  // 包含cookies
    };
    
    // 获取token并添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('[API] 添加Authorization头');
    }
    
    // 如果有数据且不是GET请求，添加到请求体
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
        console.log('[API] 请求数据:', data);
    }
    
    try {
        // 发送请求 - 确保使用完整URL
        const response = await fetch(fullUrl, config);
        console.log(`[API] 响应状态: ${response.status}`);
        
        // 处理响应
        let result;
        try {
            result = await response.json();
            console.log('[API] 响应数据:', result);
        } catch (e) {
            // 如果不是JSON，返回文本
            const text = await response.text();
            console.log('[API] 响应文本:', text);
            result = text;
        }
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(result.error || `服务器错误: ${response.status} ${response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error('[API] 请求失败:', error.message);
        throw error;
    }
}

// ====================== 用户模块 ======================

// 用户登录
async function login(email, password) {
    try {
        // 与后端路由匹配：/api/login（有/api前缀）
        const result = await apiRequest('/api/login', 'POST', { 
            email, 
            password 
        });
        console.log('Login API response:', result);
        
        // 根据后端返回的数据结构进行处理
        if (result.success && (result.access_token || result.token)) {
            // 存储用户信息
            localStorage.setItem('user_id', result.user.user_id);
            localStorage.setItem('username', result.user.name);
            localStorage.setItem('user_email', result.user.email);
            // 存储后端返回的JWT token
            localStorage.setItem('token', result.access_token || result.token);
            return result;
        } else {
            throw new Error(result.error || '登录失败');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// 用户注册
async function register(userData) {
    try {
        // 与后端路由匹配：/api/register（有/api前缀）
        const result = await apiRequest('/api/register', 'POST', userData);
        
        // 根据后端返回的数据结构进行处理
        if (result.success) {
            // 注册成功后可以直接存储用户信息，便于自动登录
            localStorage.setItem('user_id', result.user.user_id);
            localStorage.setItem('username', result.user.name);
            localStorage.setItem('user_email', result.user.email);
            // 注意：后端注册接口不返回token，需要单独登录获取
            return result;
        } else {
            throw new Error(result.error || '注册失败');
        }
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
        const result = await apiRequest('/api/users/forgot-password', 'POST', { email });
        return result;
    } catch (error) {
        throw error;
    }
}

// 更新用户信息
async function updateUser(userId, userData) {
    try {
        const result = await apiRequest(`/api/users/${userId}`, 'PUT', userData);
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 账单模块 ======================

// 添加账单
async function addBill(billData) {
    try {
        const result = await apiRequest('/api/bills', 'POST', billData);
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
        
        const result = await apiRequest(`/api/bills${queryParams}`, 'GET');
        return result.bills;
    } catch (error) {
        throw error;
    }
}

// 获取单条账单
async function getBillById(billId) {
    try {
        const result = await apiRequest(`/api/bills/${billId}`, 'GET');
        return result.bill;
    } catch (error) {
        throw error;
    }
}

// 更新账单
async function updateBill(billId, billData) {
    try {
        const result = await apiRequest(`/api/bills/${billId}`, 'PUT', billData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 删除账单
async function deleteBill(billId) {
    try {
        const result = await apiRequest(`/api/bills/${billId}`, 'DELETE');
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 预算模块 ======================

// 设置预算
async function setBudget(budgetData) {
    try {
        const result = await apiRequest('/api/budgets', 'POST', budgetData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取预算
async function getBudget(yearMonth) {
    try {
        const params = yearMonth ? `?year_month=${yearMonth}` : '';
        const result = await apiRequest(`/api/budgets${params}`, 'GET');
        return result.budget || null;
    } catch (error) {
        throw error;
    }
}

// ====================== 数据分析模块 ======================

// 获取月度收支统计
async function getMonthlyStats(month) {
    try {
        const result = await apiRequest(`/api/analytics/monthly?year_month=${month}`, 'GET');
        return result;
    } catch (error) {
        throw error;
    }
}

// 获取支出趋势
async function getExpenseTrend(months = 6) {
    try {
        const result = await apiRequest(`/api/analytics/trend?months=${months}`, 'GET');
        return result;
    } catch (error) {
        throw error;
    }
}

// ====================== 账户模块 ======================

// 获取账户列表
async function getAccounts() {
    try {
        const result = await apiRequest('/api/accounts', 'GET');
        return result.accounts;
    } catch (error) {
        throw error;
    }
}

// 添加账户
async function addAccount(accountData) {
    try {
        const result = await apiRequest('/api/accounts', 'POST', accountData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 更新账户
async function updateAccount(accountId, accountData) {
    try {
        const result = await apiRequest(`/api/accounts/${accountId}`, 'PUT', accountData);
        return result;
    } catch (error) {
        throw error;
    }
}

// 删除账户
async function deleteAccount(accountId) {
    try {
        const result = await apiRequest(`/api/accounts/${accountId}`, 'DELETE');
        return result;
    } catch (error) {
        throw error;
    }
}

// 导出数据库API
window.db = {
    // API基础URL
    API_BASE_URL: API_BASE_URL,
    // 用户模块
    login,
    register,
    getCurrentUser,
    logout,
    forgotPassword,
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
    deleteAccount,
    
    // 提供直接访问API_BASE_URL的方法
    getBaseUrl: function() {
        return API_BASE_URL;
    }
};
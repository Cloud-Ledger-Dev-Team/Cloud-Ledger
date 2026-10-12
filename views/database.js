// views/database.js
const API_BASE_URL = 'http://127.0.0.1:5000';
console.log('Database.js - API_BASE_URL:', API_BASE_URL);

async function apiRequest(endpoint, method = 'GET', data = null) {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
    };

    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    if (data && method !== 'GET') config.body = JSON.stringify(data);

    try {
        const response = await fetch(fullUrl, config);
        if (response.status === 404) {
            return { success: false, error: '接口未找到' };
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('[API] 请求失败:', error);
        return { success: false, error: error.message };
    }
}

// 用户模块
async function login(email, password) {
    const result = await apiRequest('/api/login', 'POST', { email, password });
    if (result.success && result.token) {
        localStorage.setItem('user_id', result.user.user_id);
        localStorage.setItem('username', result.user.name);
        localStorage.setItem('user_email', result.user.email);
        localStorage.setItem('token', result.token);
    }
    return result;
}

async function register(userData) {
    return apiRequest('/api/register', 'POST', userData);
}

function getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    return userId ? { userId } : null;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login_register.html';
}

// 账单模块
async function getBills(filters = {}) {
    const params = new URLSearchParams();
    params.append('user_id', filters.user_id);
    
    // 添加筛选条件
    if (filters.type && filters.type !== '') {
        params.append('type', filters.type);
    }
    if (filters.startDate) {
        params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
        params.append('endDate', filters.endDate);
    }
    
    const query = `?${params.toString()}`;
    const result = await apiRequest(`/api/bills${query}`, 'GET');
    return result.bills || [];
}

async function addBill(data) { return apiRequest('/api/bills', 'POST', data); }

// 【新增】删除账单
async function deleteBill(billId) {
    return apiRequest(`/api/bills/${billId}`, 'DELETE');
}

// 【新增】更新账单
async function updateBill(billId, data) {
    return apiRequest(`/api/bills/${billId}`, 'PUT', data);
}

// 账户模块
async function getAccounts(userId) {
    const uid = userId || localStorage.getItem('user_id');
    const result = await apiRequest(`/api/accounts?user_id=${uid}`, 'GET');
    return result.accounts || [];
}

async function addAccount(data) { return apiRequest('/api/accounts', 'POST', data); }
async function deleteAccount(id) { return apiRequest(`/api/accounts/${id}`, 'DELETE'); }
async function updateAccount(id, data) { return apiRequest(`/api/accounts/${id}`, 'PUT', data); }

// 导出
window.db = {
    API_BASE_URL,
    login, register, getCurrentUser, logout,
    getBills, addBill, deleteBill, updateBill, // 记得导出新函数
    getAccounts, addAccount, updateAccount, deleteAccount
};
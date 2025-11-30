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
        // 如果是 404，不要直接抛错，而是返回特定的 JSON
        if (response.status === 404) {
            console.warn(`API 404: ${fullUrl}`);
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
    const result = await apiRequest('/api/register', 'POST', userData);
    if (result.success && result.user) {
        // 注册成功后自动登录逻辑需由前端控制跳转，这里只负责存数据
        localStorage.setItem('user_id', result.user.user_id);
    }
    return result;
}

function getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    return userId ? { userId } : null;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login_register.html';
}

// 【关键修复】确保返回数组，防止 undefined 报错
async function getBills(filters = {}) {
    let query = `?user_id=${filters.user_id}`;
    // 添加其他筛选参数...
    const result = await apiRequest(`/api/bills${query}`, 'GET');
    // 如果 result.bills 不存在，返回空数组
    return result.bills || [];
}

async function getAccounts(userId) {
    // 兼容传参方式
    const uid = userId || localStorage.getItem('user_id');
    const result = await apiRequest(`/api/accounts?user_id=${uid}`, 'GET');
    // 如果 result.accounts 不存在，返回空数组
    return result.accounts || [];
}

async function addBill(data) { return apiRequest('/api/bills', 'POST', data); }
async function addAccount(data) { return apiRequest('/api/accounts', 'POST', data); }
async function deleteAccount(id) { return apiRequest(`/api/accounts/${id}`, 'DELETE'); }
async function updateAccount(id, data) { return apiRequest(`/api/accounts/${id}`, 'PUT', data); }

// 导出
window.db = {
    API_BASE_URL,
    login, register, getCurrentUser, logout,
    getBills, addBill,
    getAccounts, addAccount, updateAccount, deleteAccount
};
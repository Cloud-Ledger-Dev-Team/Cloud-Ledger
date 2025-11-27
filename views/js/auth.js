// auth.js - 认证模块
// 导入UI反馈模块（使用默认导入以避免命名导入错误）
import uiFeedback from './ui-feedback.js';
// 从默认导入中解构出需要的函数
const { showError, hideError, showToastModal } = uiFeedback;
import { DOM } from './dom-helpers.js';
// 导入database.js中的认证功能
import { login as dbLogin, register as dbRegister, logout as dbLogout, checkAuth, getCurrentUser } from './database.js';

// 导出初始化认证模块的函数
export function initAuthModule(isAuthPage, isLoggedIn) {
  console.log('初始化认证模块');

  // 初始化登录/注册标签切换
  setupLoginRegisterTabs();

  // 根据当前页面状态初始化相应的表单
  if (document.getElementById('login-form')) {
    setupLoginForm();
  }

  if (document.getElementById('registerForm')) {
    setupRegisterForm();
  }

  // 设置忘记密码功能
  setupForgotPasswordLink();

  // 如果用户已登录，显示相应状态
  if (isLoggedIn) {
    console.log('用户已登录');
  }
}

// 设置登录/注册标签切换
function setupLoginRegisterTabs() {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginFormContainer = document.getElementById('loginForm'); // 表单容器
  const registerFormContainer = document.getElementById('registerForm'); // 表单容器

  if (loginTab && registerTab && loginFormContainer && registerFormContainer) {
    loginTab.addEventListener('click', function () {
      // 激活登录标签，显示登录表单容器
      loginTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
      loginTab.classList.remove('text-gray-700');
      registerTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
      registerTab.classList.add('text-gray-700');

      loginFormContainer.classList.remove('hidden');
      registerFormContainer.classList.add('hidden');

      // 重新初始化表单
      setupLoginForm();
    });

    registerTab.addEventListener('click', function () {
      // 激活注册标签，显示注册表单容器
      registerTab.classList.add('bg-white', 'text-primary', 'shadow-sm');
      registerTab.classList.remove('text-gray-700');
      loginTab.classList.remove('bg-white', 'text-primary', 'shadow-sm');
      loginTab.classList.add('text-gray-700');

      registerFormContainer.classList.remove('hidden');
      loginFormContainer.classList.add('hidden');

      // 重新初始化表单
      setupRegisterForm();
    });
  }
}

// 设置注册表单
export function setupRegisterForm() {
  // 找到注册表单容器内的表单元素
  const registerFormContainer = document.getElementById('registerForm');
  if (!registerFormContainer) {
    console.error('Register form container not found.');
    return;
  }
  
  const registerForm = registerFormContainer.querySelector('form');
  if (!registerForm) {
    console.error('Register form element not found.');
    return;
  }

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // 表单验证逻辑
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmRegisterPassword').value; // 使用正确的ID

    // 简单验证
    if (!email || !password || !confirmPassword) {
      showError('请填写所有必填字段');
      return;
    }

    if (password !== confirmPassword) {
      showError('两次输入的密码不一致');
      return;
    }

    try {
      // 使用database.js中的注册API代替模拟注册
      console.log('注册用户:', email);
      const result = await dbRegister({ email, password });
      console.log('注册结果:', result);

      if (result.success) {
        // 注册成功后切换到登录页面
        document.getElementById('loginTab').click();
        showToastModal('注册成功', '请使用您的账号登录');
      } else {
        showError('注册失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('注册异常:', error);
      showError('注册失败: ' + error.message);
    }
  });
}

// 设置登录表单
export function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    console.error('Login form with ID "login-form" not found.');
    return;
  }

  // 将事件监听器绑定到 form 的 submit 事件上
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault(); // 关键：阻止表单默认提交行为

    // 表单验证逻辑
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // 简单验证
    if (!email || !password) {
      showError('请填写所有必填字段');
      return;
    }

    try {
      // 使用database.js中的登录API
      console.log('登录用户:', email);
      const result = await dbLogin(email, password);
      console.log('登录结果:', result);

      if (result.success) {
        // 登录成功后跳转到cloud_ledger.html
        console.log('准备跳转到cloud_ledger.html');

        window.location.href = 'cloud_ledger.html'; // 登录成功后的跳转
      } else {
        showError('登录失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('登录异常:', error);
      showError('登录失败: ' + error.message);
    }
  });
}

// 设置忘记密码功能
export function setupForgotPasswordLink() {
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (!forgotPasswordLink) {
    console.error('Forgot password link not found.');
    return;
  }

  forgotPasswordLink.addEventListener('click', function (e) {
    e.preventDefault();

    // 显示忘记密码表单或模态框
    console.log('显示忘记密码表单');
    // 实际项目中这里应该显示忘记密码的模态框

    showToastModal('忘记密码', '请联系管理员重置密码');
  });
}

// 检查用户登录状态
export function checkUserLoggedIn() {
  try {
    // 使用database.js中的认证检查函数
    return checkAuth();
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
}

// 替代显示登录注册弹窗功能
export function showAuthModal() {
  console.log('显示登录注册弹窗请求');
}

// 替代关闭登录注册弹窗功能
export function closeAuthModal() {
  console.log('关闭登录注册弹窗请求');
}

// 导出注销功能
export async function logoutUser() {
  try {
    // 使用database.js中的登出函数
    await dbLogout();
    window.location.reload();
  } catch (error) {
    console.error('登出异常:', error);
    // 即使登出出错，也清除本地存储并重载页面
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_email');
    localStorage.removeItem('token');
    window.location.reload();
  }
}

// 将checkUserLoggedIn挂载到全局，方便其他模块使用
window.checkUserLoggedIn = checkUserLoggedIn;
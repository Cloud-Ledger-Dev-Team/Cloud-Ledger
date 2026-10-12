import request from './request'

// 用户注册
export function register(data) {
  return request.post('/register', data)
}

// 用户登录
export function login(data) {
  return request.post('/login', data)
}

// 用户登出
export function logout() {
  return request.post('/logout')
}

// 发送密码重置验证码（忘记密码）
export function sendResetCode(data) {
  return request.post('/password/forgot/code', data)
}

// 重置密码（凭邮箱验证码）
export function resetPassword(data) {
  return request.post('/password/forgot/reset', data)
}

// 登录态修改密码
export function changePassword(data) {
  return request.post('/password/change', data)
}

import request from './request'

// 账户列表
export function listAccounts(userId) {
  return request.get('/accounts', { params: { user_id: userId } })
}

// 创建账户
export function createAccount(data) {
  return request.post('/accounts', data)
}

// 更新账户
export function updateAccount(accountId, data) {
  return request.put(`/accounts/${accountId}`, data)
}

// 删除账户
export function deleteAccount(accountId) {
  return request.delete(`/accounts/${accountId}`)
}

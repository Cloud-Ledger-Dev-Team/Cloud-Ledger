import request from './request'

// 添加交易记录
export function createTransaction(data) {
  return request.post('/transactions/', data)
}

// 交易记录列表
export function listTransactions(userId) {
  return request.get('/transactions/', { params: { user_id: userId } })
}

// 更新交易记录
export function updateTransaction(transactionId, data) {
  return request.put(`/transactions/${transactionId}`, data)
}

// 删除交易记录
export function deleteTransaction(transactionId) {
  return request.delete(`/transactions/${transactionId}`)
}

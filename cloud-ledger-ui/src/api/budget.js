import request from './request'

// 设置/更新月度预算（upsert）
export function setBudget(data) {
  return request.post('/budgets/', data)
}

// 查询指定月份预算
export function getBudget(userId, month) {
  return request.get(`/budgets/${userId}/${month}`)
}

// 修改预算金额
export function updateBudget(budgetId, data) {
  return request.put(`/budgets/${budgetId}`, data)
}

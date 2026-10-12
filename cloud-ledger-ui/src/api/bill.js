import request from './request'

// 账单列表
export function listBills(params) {
  return request.get('/bills', { params })
}

// 创建账单
export function createBill(data) {
  return request.post('/bills', data)
}

// 更新账单
export function updateBill(billId, data) {
  return request.put(`/bills/${billId}`, data)
}

// 删除账单
export function deleteBill(billId) {
  return request.delete(`/bills/${billId}`)
}

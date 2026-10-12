import request from './request'

// 月度收支统计
export function monthlyStats(userId, month) {
  return request.get(`/analytics/monthly/${userId}/${month}`)
}

// 多月份收支趋势
export function trend(userId, months = 6) {
  return request.get(`/analytics/trend/${userId}`, { params: { months } })
}

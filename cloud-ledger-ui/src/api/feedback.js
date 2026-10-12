import request from './request'

// 提交用户反馈（需鉴权）
export function submitFeedback(data) {
  return request.post('/feedback', data)
}

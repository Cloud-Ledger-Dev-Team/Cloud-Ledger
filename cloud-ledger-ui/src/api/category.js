import request from './request'

// 获取可用分类（系统预设 + 当前用户自定义）
export function getCategories() {
  return request.get('/categories/')
}

// 创建用户自定义分类
// body: { name, type, icon?, color?, sort_order? }
export function createCategory(body) {
  return request.post('/categories/', body)
}

// 更新用户自定义分类
export function updateCategory(id, body) {
  return request.put(`/categories/${id}`, body)
}

// 删除用户自定义分类
export function deleteCategory(id) {
  return request.delete(`/categories/${id}`)
}

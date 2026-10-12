import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

// 请求拦截器：统一注入 Authorization
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理 Result{code,msg,data} 结构
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 后端所有响应 HTTP 200，业务状态在 code 字段
    if (res && typeof res.code === 'number') {
      if (res.code === 200) {
        return res
      }
      // 401：Token 失效，清除并跳转登录
      if (res.code === 401) {
        localStorage.removeItem('cl_token')
        localStorage.removeItem('cl_user')
        ElMessage.error(res.msg || '登录已过期，请重新登录')
        router.push({ name: 'login' })
        return Promise.reject(new Error(res.msg || '未授权'))
      }
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  (error) => {
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  }
)

export default request

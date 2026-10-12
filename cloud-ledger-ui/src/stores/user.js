import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('cl_token') || '',
    user: JSON.parse(localStorage.getItem('cl_user') || 'null')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.user?.user_id || '',
    userName: (state) => state.user?.name || ''
  },
  actions: {
    setLogin(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('cl_token', token)
      localStorage.setItem('cl_user', JSON.stringify(user))
    },
    clear() {
      this.token = ''
      this.user = null
      localStorage.removeItem('cl_token')
      localStorage.removeItem('cl_user')
    },
    restore() {
      // 状态已在初始化时从 localStorage 恢复，此处仅做兜底
      if (!this.token) {
        this.token = localStorage.getItem('cl_token') || ''
      }
      if (!this.user) {
        try {
          this.user = JSON.parse(localStorage.getItem('cl_user') || 'null')
        } catch (e) {
          this.user = null
        }
      }
    }
  }
})

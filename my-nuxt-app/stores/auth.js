import { defineStore } from 'pinia'
import api from '~/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async initializeAuth() {
      if (process.client) {
        const token = localStorage.getItem('token')
        if (token) {
          this.token = token
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          await this.fetchUser()
        }
      }
    },
    async login(email, password) {
      try {
        const response = await api.post('/users/login', { email, password })
        if (response.data && response.data.token) {
          this.token = response.data.token
          this.user = response.data.user || response.data.data?.user || null
          if (process.client) {
            localStorage.setItem('token', this.token)
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        } else {
          throw new Error('Invalid response from server')
        }
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    async signup(userData) {
      try {
        const response = await api.post('/users/register', userData)
        this.token = response.data.token
        this.user = response.data.data.user
        if (process.client) {
          localStorage.setItem('token', this.token)
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      } catch (error) {
        console.error('Signup error:', error)
        throw error
      }
    },
    async fetchUser() {
      try {
        const response = await api.get('/users/me')
        this.user = response.data.data.user
      } catch (error) {
        console.error('Error fetching user:', error)
        this.logout()
      }
    },
    logout() {
      this.user = null
      this.token = null
      if (process.client) {
        localStorage.removeItem('token')
      }
      delete api.defaults.headers.common['Authorization']
    },
  },
})
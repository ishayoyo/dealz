import { defineStore } from 'pinia'
import api from '~/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    tokenExpirationTime: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && state.tokenExpirationTime > Date.now(),
  },
  actions: {
    async initializeAuth() {
      if (process.client) {
        const token = localStorage.getItem('token')
        const tokenExpirationTime = localStorage.getItem('tokenExpirationTime')
        if (token && tokenExpirationTime) {
          this.token = token
          this.tokenExpirationTime = parseInt(tokenExpirationTime)
          if (this.isAuthenticated) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            await this.fetchUser()
          } else {
            this.logout()
          }
        }
      }
    },
    async login(email, password) {
      try {
        const response = await api.post('/users/login', { email, password })
        if (response.data && response.data.token) {
          this.setAuthData(response.data)
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
        this.setAuthData(response.data)
      } catch (error) {
        console.error('Signup error:', error)
        throw error
      }
    },
    setAuthData(data) {
      this.token = data.token
      this.user = data.user || data.data?.user || null
      // Assume token expires in 1 hour (3600000 ms)
      this.tokenExpirationTime = Date.now() + 3600000
      if (process.client) {
        localStorage.setItem('token', this.token)
        localStorage.setItem('tokenExpirationTime', this.tokenExpirationTime.toString())
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      this.setupTokenExpirationCheck()
    },
    setupTokenExpirationCheck() {
      if (process.client) {
        const timeUntilExpiration = this.tokenExpirationTime - Date.now()
        setTimeout(() => {
          if (!this.isAuthenticated) {
            this.logout()
          }
        }, timeUntilExpiration)
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
      this.tokenExpirationTime = null
      if (process.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpirationTime')
      }
      delete api.defaults.headers.common['Authorization']
      // Redirect to main page
      if (process.client) {
        window.location.href = '/'
      }
    },
  },
})
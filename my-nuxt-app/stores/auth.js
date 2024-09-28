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
          const response = await api.post('/users/login', { email, password });
          if (response.data && response.data.token) {
            this.setAuthData(response.data);
            return true;
          } else {
            console.error('Invalid response from server:', response.data);
            return false;
          }
        } catch (error) {
          console.error('Login error:', error);
          if (error.response) {
            console.error('Error response:', error.response.data);
          }
          throw error;
        }
      },

      async signup(userData) {
        try {
          const response = await api.post('/users/register', userData);
          if (response.data && response.data.token) {
            this.setAuthData(response.data);
            return true;
          } else {
            console.error('Invalid response from server:', response.data);
            return false;
          }
        } catch (error) {
          console.error('Signup error:', error);
          if (error.response) {
            console.error('Error response:', error.response.data);
          }
          throw error;
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
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        this.setupTokenExpirationCheck()
      }
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
        return this.user
      } catch (error) {
        console.error('Error fetching user:', error)
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired
          this.logout()
        }
        throw error
      }
    },

    async logout() {
      try {
        if (!this.$api) {
          console.error('API instance is not available')
          return
        }

        // Remove the token from the API headers
        delete this.$api.defaults.headers.common['Authorization']

        // Call the logout endpoint
        await this.$api.post('/auth/logout')

        // Clear the user data and token
        this.user = null
        this.token = null
        localStorage.removeItem('token')

        // Redirect to login page or home page
        // You might want to use the router for this
        // this.router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
        // Handle the error (e.g., show a notification to the user)
      }
    },
  },
})
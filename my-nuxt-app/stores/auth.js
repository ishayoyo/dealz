import { defineStore } from 'pinia'
import api from '~/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    tokenExpirationTime: null,
  }),

  getters: {
    isAuthenticated: (state) => {
      const isValid = !!state.token && state.tokenExpirationTime > Date.now()
      console.log('isAuthenticated getter called:', { isValid, token: state.token, expiration: state.tokenExpirationTime })
      return isValid
    },
  },

  actions: {
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
      this.tokenExpirationTime = Date.now() + 3600000 // 1 hour from now
      if (process.client) {
        localStorage.setItem('token', this.token)
        localStorage.setItem('tokenExpirationTime', this.tokenExpirationTime.toString())
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        this.setupTokenExpirationCheck()
      }
      console.log('Auth data set:', { token: this.token, user: this.user, expiration: this.tokenExpirationTime })
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
        // Remove the token from the API headers
        delete api.defaults.headers.common['Authorization']

        // Call the logout endpoint
        await api.post('/auth/logout')

        // Clear the user data and token
        this.user = null
        this.token = null
        this.tokenExpirationTime = null
        if (process.client) {
          localStorage.removeItem('token')
          localStorage.removeItem('tokenExpirationTime')
        }

        console.log('Logout successful')
      } catch (error) {
        console.error('Logout failed:', error)
        // Handle the error (e.g., show a notification to the user)
      } finally {
        // Ensure state is reset even if the API call fails
        this.user = null
        this.token = null
        this.tokenExpirationTime = null
      }
    },

    async initializeAuth() {
      if (process.client) {
        const token = useCookie('auth_token').value
        const tokenExpirationTime = useCookie('tokenExpirationTime').value
        
        console.log('Initializing auth with stored data:', { token, tokenExpirationTime })
        
        if (token && tokenExpirationTime) {
          this.token = token
          this.tokenExpirationTime = parseInt(tokenExpirationTime)
          
          if (this.isAuthenticated) {
            api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
            await this.fetchUser()
            this.setupTokenExpirationCheck()
          } else {
            console.log('Token expired, logging out')
            this.logout()
          }
        } else {
          console.log('No stored auth data found')
        }
        console.log('Auth initialized:', { token: this.token, expiration: this.tokenExpirationTime, isAuthenticated: this.isAuthenticated })
      }
    },
  },
})
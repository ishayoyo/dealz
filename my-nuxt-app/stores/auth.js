import { defineStore } from 'pinia'
import api from '~/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/users/login', { email, password });
        if (response.data && response.data.user) {
          this.setUser(response.data.user);
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
        if (response.data && response.data.user) {
          this.setUser(response.data.user);
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

    setUser(user) {
      this.user = user;
      console.log('User data set:', { user: this.user });
    },

    async fetchUser() {
      try {
        const response = await api.get('/users/me');
        this.setUser(response.data.data.user);
        return this.user;
      } catch (error) {
        console.error('Error fetching user:', error);
        if (error.response && error.response.status === 401) {
          // Token is invalid or expired
          this.logout();
        }
        throw error;
      }
    },

    async logout() {
      try {
        await api.post('/users/logout');
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        this.user = null;
        console.log('Logout successful');
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
import { defineStore } from 'pinia'
import api from '~/services/api'
import { useCookie } from 'nuxt/app'

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
        if (response.data && response.data.status === 'success') {
          this.setUser(response.data.data.user);
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
        if (response.data && response.data.status === 'success' && response.data.data.user) {
          this.setUser(response.data.data.user);
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
        const handled = await this.handleAuthError(error);
        if (!handled) {
          console.error('Error fetching user:', error);
          this.user = null;
          throw error;
        }
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
      console.log('Auth store: Starting initializeAuth')
      if (process.client) {
        console.log('Auth store: Running on client')
        try {
          const isAuthenticated = await this.checkAuth()
          console.log('Auth store: Auth initialized:', { isAuthenticated })
        } catch (error) {
          console.error('Auth store: Error initializing auth:', error)
          this.user = null
        }
      } else {
        console.log('Auth store: Running on server, skipping initializeAuth')
      }
    },

    async checkAuth() {
      const token = useCookie('accessToken').value;
      if (!token) {
        this.user = null;
        return false;
      }

      try {
        const response = await api.get('/users/me');
        if (response.data && response.data.data.user) {
          this.setUser(response.data.data.user);
          return true;
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('User not authenticated');
          this.user = null;
          return false;
        }
        console.error('Error checking auth:', error);
      }
      this.user = null;
      return false;
    },

    async handleAuthError(error) {
      if (error.response && error.response.status === 401) {
        // Token might be expired, try to refresh
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // If refresh was successful, retry the original request
          return true
        } else {
          // If refresh failed, log out the user
          await this.logout()
          return false
        }
      }
      // For other errors, just log them
      console.error('Authentication error:', error)
      return false
    },
    
    async refreshToken() {
      // Only attempt to refresh if we think we're authenticated
      if (!this.isAuthenticated) {
        console.log('Not authenticated, skipping token refresh');
        return false;
      }

      try {
        const response = await api.post('/users/refresh-token');
        // The cookie will be automatically handled by the browser
        return true;
      } catch (error) {
        console.error('Error refreshing token:', error);
        // If refresh fails, log the user out
        await this.logout();
        return false;
      }
    },
  },
})
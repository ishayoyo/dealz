import { defineStore } from 'pinia'
import api from '~/services/api'
import { useCookie } from '#app'
import { useRuntimeConfig } from '#app'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loginCountdown: 0,
    signupCountdown: 0,
    loginAttemptsLeft: 5,
    signupAttemptsLeft: 5,
    loginCountdownTimer: null,
    signupCountdownTimer: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isLoginRateLimited: (state) => state.loginCountdown > 0,
    isSignupRateLimited: (state) => state.signupCountdown > 0,
  },

  actions: {
    async login(email, password) {
      if (this.isLoginRateLimited) {
        return { success: false, error: `Rate limited. Please try again in ${Math.ceil(this.loginCountdown / 60)} minutes.` };
      }

      try {
        const response = await api.post('/users/login', { email, password });
        if (response.data.status === 'success') {
          this.setUser(response.data.data.user);
          return { success: true };
        } else if (response.data.requiresVerification) {
          return { success: false, requiresVerification: true, message: response.data.message };
        } else {
          console.error('Unexpected response from server:', response.data);
          return { success: false, error: 'An unexpected error occurred' };
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.response?.status === 403 && error.response.data.requiresVerification) {
          return { success: false, requiresVerification: true, message: error.response.data.message };
        }
        return { success: false, error: error.response?.data?.message || error.message || 'An error occurred during login' };
      }
    },

    async signup(userData) {
      if (this.isSignupRateLimited) {
        return { success: false, error: `Rate limited. Please try again in ${Math.ceil(this.signupCountdown / 60)} minutes.` };
      }

      try {
        const response = await api.post('/users/register', userData);
        if (response.data && response.data.status === 'success') {
          // Don't set the user here, as they need to verify their email first
          return { 
            success: true, 
            message: response.data.message,
            requiresVerification: true
          };
        } else {
          console.error('Invalid response from server:', response.data);
          return { success: false, error: 'Invalid response from server' };
        }
      } catch (error) {
        console.error('Signup error:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          if (error.response.status === 429) {
            this.handleSignupRateLimiting(error);
            return { success: false, error: `Too many attempts. Please try again in ${Math.ceil(this.signupCountdown / 60)} minutes.` };
          }
          if (error.response.status === 400) {
            return { success: false, error: error.response.data.message || 'Invalid signup data' };
          }
        }
        return { success: false, error: error.response?.data?.message || error.message || 'An error occurred during signup' };
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
      const nuxtApp = useNuxtApp()
      
      if (!nuxtApp.ssrContext) {
        console.log('Auth store: Running on client')
        try {
          const response = await api.get('/users/me')
          if (response.data && response.data.data.user) {
            this.setUser(response.data.data.user)
            console.log('Auth store: User data fetched and set')
          }
        } catch (error) {
          console.error('Auth store: Error fetching user data:', error)
          this.user = null
          // Don't clear the cookie here, let the server handle it
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

    startCountdown(seconds) {
      this.countdown = seconds
      const endTime = Date.now() + seconds * 1000
      this.countdownEndTime = endTime
      localStorage.setItem('countdownEndTime', endTime.toString())
      
      const countdownInterval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((this.countdownEndTime - now) / 1000))
        this.countdown = remaining
        
        if (this.countdown <= 0) {
          clearInterval(countdownInterval)
          localStorage.removeItem('countdownEndTime')
        }
      }, 1000)
    },

    initializeCountdown() {
      const storedEndTime = localStorage.getItem('countdownEndTime')
      if (storedEndTime) {
        const endTime = parseInt(storedEndTime)
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
        if (remaining > 0) {
          this.startCountdown(remaining)
        } else {
          localStorage.removeItem('countdownEndTime')
        }
      }
    },

    handleRateLimiting(error) {
      const retryAfter = error.response.headers['retry-after']
      if (retryAfter) {
        this.startCountdown(parseInt(retryAfter))
      } else {
        this.startCountdown(180) // 3 minutes
      }
      this.attemptsLeft = 0 // Set attempts to 0 when rate limited
      throw error
    },

    startLoginCountdown(seconds) {
      this.loginCountdown = seconds;
      clearInterval(this.loginCountdownTimer);
      this.loginCountdownTimer = setInterval(() => {
        if (this.loginCountdown > 0) {
          this.loginCountdown--;
        } else {
          clearInterval(this.loginCountdownTimer);
          this.loginAttemptsLeft = 5; // Reset attempts when countdown ends
        }
      }, 1000);
    },

    startSignupCountdown(seconds) {
      this.signupCountdown = seconds;
      clearInterval(this.signupCountdownTimer);
      this.signupCountdownTimer = setInterval(() => {
        if (this.signupCountdown > 0) {
          this.signupCountdown--;
        } else {
          clearInterval(this.signupCountdownTimer);
          this.signupAttemptsLeft = 5; // Reset attempts when countdown ends
        }
      }, 1000);
    },

    handleLoginRateLimiting(error) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        this.startLoginCountdown(parseInt(retryAfter));
      } else {
        this.startLoginCountdown(180); // 3 minutes
      }
      this.loginAttemptsLeft = 0;
    },

    handleSignupRateLimiting(error) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        this.startSignupCountdown(parseInt(retryAfter));
      } else {
        this.startSignupCountdown(180); // 3 minutes
      }
      this.signupAttemptsLeft = 0;
    },

    // Add a cleanup method to clear timers
    clearTimers() {
      clearInterval(this.loginCountdownTimer);
      clearInterval(this.signupCountdownTimer);
    },

    async followUser(userId) {
      try {
        const currentUser = this.user;
        console.log('Current user:', currentUser);
        console.log('User ID to follow:', userId);

        if (!currentUser || userId === currentUser._id) {
          console.log('Invalid operation: user not logged in or trying to follow self');
          return { success: false, error: "Invalid operation" };
        }

        const isCurrentlyFollowing = currentUser.following && currentUser.following.includes(userId);
        const method = isCurrentlyFollowing ? 'delete' : 'post';
        
        console.log(`Sending ${method} request to /users/${userId}/follow`);
        const response = await api[method](`/users/${userId}/follow`);
        
        console.log('Response from server:', response.data);

        if (response.data && response.data.status === 'success') {
          // Update local user data
          if (isCurrentlyFollowing) {
            this.user.following = this.user.following.filter(id => id !== userId);
          } else {
            this.user.following = [...(this.user.following || []), userId];
          }
          return { 
            success: true, 
            isFollowing: !isCurrentlyFollowing,
            followerCount: response.data.data?.followerCount
          };
        }
        if (response.data && response.data.status === 'error' && response.data.message === 'You are already following this user') {
          return {
            success: true,
            isFollowing: true,
            message: 'You are already following this user'
          };
        }
        return { success: false, error: 'Failed to update follow status' };
      } catch (error) {
        console.error('Error following/unfollowing user:', error);
        console.error('Error response:', error.response?.data);
        if (error.response && error.response.data) {
          return { 
            success: false, 
            error: error.response.data.message || 'An error occurred',
            isFollowing: error.response.data.message === 'You are already following this user'
          };
        }
        return { 
          success: false, 
          error: 'An error occurred while updating follow status'
        };
      }
    },

    showAuthModal(mode = 'login') {
      this.showAuthModalFlag = true
      this.authModalMode = mode
    },

    hideAuthModal() {
      this.showAuthModalFlag = false
    },

    async verifyEmail(code) {
      const config = useRuntimeConfig()
      try {
        const response = await $fetch('/users/verify-email', {
          method: 'POST',
          body: { code },
          baseURL: config.public.apiBase
        })
        if (response.status === 'success') {
          return { success: true }
        } else {
          return { success: false, error: response.message }
        }
      } catch (error) {
        console.error('Email verification failed:', error)
        return { success: false, error: error.message || 'Verification failed' }
      }
    },

    async resendVerificationEmail() {
      try {
        const response = await api.post('/users/resend-verification');
        if (response.data.status === 'success') {
          return { success: true };
        } else {
          return { success: false, error: response.data.message };
        }
      } catch (error) {
        console.error('Resend verification email error:', error);
        return { success: false, error: error.response?.data?.message || 'An error occurred while resending the verification email' };
      }
    }
  },
})

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
    authProvider: null, // Add this to track auth provider
    isInitialized: false, // Add this flag
    isLoading: true, // Add this
  }),

  getters: {
    isAuthenticated: (state) => !!state.user && state.isInitialized && !state.isLoading,
    isLoginRateLimited: (state) => state.loginCountdown > 0,
    isSignupRateLimited: (state) => state.signupCountdown > 0,
    isGoogleAuth: (state) => state.authProvider === 'google', // Add this getter
  },

  actions: {
    async login(email, password, provider = 'local') {
      if (provider === 'google') {
        return this.googleLogin();
      }

      if (this.loginCountdown > 0) {
        return { success: false, error: `Rate limited. Please try again in ${Math.ceil(this.loginCountdown / 60)} minutes.` };
      }

      try {
        const response = await api.post('/users/login', { email, password });
        if (response.data.status === 'success') {
          this.setUser(response.data.data.user);
          this.loginAttemptsLeft = 5; // Reset attempts on successful login
          return { success: true };
        } else if (response.data.requiresVerification) {
          return { success: false, requiresVerification: true, message: response.data.message };
        } else {
          this.loginAttemptsLeft = response.data.attemptsLeft;
          return { 
            success: false, 
            error: response.data.message || 'An unexpected error occurred',
            attemptsLeft: this.loginAttemptsLeft
          };
        }
      } catch (error) {
        if (error.response?.status === 429) {
          this.handleLoginRateLimiting(error);
          return { 
            success: false, 
            error: 'Too many login attempts. Please try again later.',
            attemptsLeft: 0
          };
        }
        this.loginAttemptsLeft = error.response?.data?.attemptsLeft || Math.max(this.loginAttemptsLeft - 1, 0);
        return { 
          success: false, 
          error: error.response?.data?.message || error.message || 'An error occurred during login',
          attemptsLeft: this.loginAttemptsLeft
        };
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

    setUser(user, provider = 'local') {
      console.log('Setting user:', user, 'provider:', provider);
      this.user = user;
      this.authProvider = provider;
      this.isInitialized = true;
      this.isLoading = false;
    },

    clearUser() {
      console.log('Clearing user');
      this.user = null;
      this.authProvider = null;
      this.isInitialized = true;
      this.isLoading = false;
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
        // Clear any Google OAuth state
        if (this.authProvider === 'google') {
          // Add a small delay to ensure proper cleanup
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Call backend logout
        await api.post('/users/logout');
        
        // Clear local state
        this.clearUser();
        
        // Clear any stored tokens
        const accessTokenCookie = useCookie('accessToken');
        const refreshTokenCookie = useCookie('refreshToken');
        accessTokenCookie.value = null;
        refreshTokenCookie.value = null;
        
        // Redirect to home page
        const router = useRouter();
        await router.push('/');
        
        // Force page reload to clear all states
        if (process.client) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    },

    async initializeAuth() {
      if (process.server) return;
      
      this.isLoading = true;
      try {
        const route = useRoute();
        
        if (route.query.auth === 'success') {
          console.log('Google auth success detected');
          const response = await api.get('/users/me');
          if (response.data?.data?.user) {
            this.setUser(response.data.data.user, 'google');
          }
        } else {
          const response = await api.get('/users/me');
          if (response.data?.data?.user) {
            const provider = response.data.data.user.googleId ? 'google' : 'local';
            this.setUser(response.data.data.user, provider);
          } else {
            this.clearUser();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        this.clearUser();
      } finally {
        this.isLoading = false;
        this.isInitialized = true;
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
        this.startLoginCountdown(300); // 5 minutes
      }
      this.loginAttemptsLeft = 0;
    },

    handleSignupRateLimiting(error) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        this.startSignupCountdown(parseInt(retryAfter));
      } else {
        this.startSignupCountdown(300); // 5 minutes
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
      try {
        const response = await api.post('/users/verify-email', { code });
        if (response.data.status === 'success') {
          if (this.user) {
            this.user.isVerified = true;
          }
          return { success: true };
        } else if (response.data.alreadyVerified) {
          return { success: true, alreadyVerified: true };
        } else {
          return { success: false, error: response.data.message };
        }
      } catch (error) {
        console.error('Email verification failed:', error);
        return { success: false, error: error.response?.data?.message || 'Verification failed' };
      }
    },
    
    async resendVerificationEmail(email) {
      try {
        const response = await api.post('/users/resend-verification', { email });
        if (response.data.status === 'success') {
          return { 
            success: true, 
            message: response.data.message
          };
        } else {
          return { 
            success: false, 
            error: 'An error occurred. Please try again later.'
          };
        }
      } catch (error) {
        console.error('Resend verification email error:', error);
        return { 
          success: false, 
          error: 'An error occurred. Please try again later.'
        };
      }
    },

    updateFollowerCount(count) {
      if (this.user) {
        this.user.followerCount = count
      }
    },

    updateUser(userData) {
      if (this.user) {
        this.user = { ...this.user, ...userData }
      }
    },

    async forgotPassword(email) {
      try {
        const response = await api.post('/users/forgot-password', { email });
        if (response.data.status === 'success') {
          return { success: true, message: response.data.message };
        } else {
          return { success: false, error: response.data.message || 'An error occurred' };
        }
      } catch (error) {
        console.error('Forgot password error:', error);
        return { 
          success: false, 
          error: error.response?.data?.message || 'An error occurred while processing your request'
        };
      }
    },

    async resetPassword(token, newPassword, passwordConfirmation) {
      try {
        console.log('Calling API to reset password with token:', token);
        const response = await api.patch(`/users/reset-password/${token}`, { 
          password: newPassword, // Changed from newPassword to password to match backend
          confirmPassword: passwordConfirmation // Added confirmPassword
        });
        
        console.log('API response:', response.data);
        
        if (response.data.status === 'success') {
          return { success: true };
        } else {
          return { success: false, error: response.data.message || 'Password reset failed' };
        }
      } catch (error) {
        console.error('Error in authStore.resetPassword:', error);
        console.error('Error response data:', error.response?.data);
        return { 
          success: false, 
          error: error.response?.data?.message || 'An error occurred while resetting the password'
        };
      }
    },

    async checkVerificationStatus(email) {
      try {
        const response = await api.post('/users/check-verification', { email });
        return response.data;
      } catch (error) {
        console.error('Error checking verification status:', error);
        throw error;
      }
    },

    // Add these new actions for Google authentication
    async handleGoogleCallback(code) {
      try {
        const loginTimestamp = sessionStorage.getItem('googleLoginInitiated');
        if (loginTimestamp) {
          const timeDiff = Date.now() - parseInt(loginTimestamp);
          if (timeDiff > 300000) {
            throw new Error('Login request expired');
          }
        }

        // Add /v1 to the path
        const response = await api.get(`/v1/users/auth/google/callback?code=${code}`);
        if (response.data.status === 'success') {
          sessionStorage.removeItem('googleLoginInitiated');
          await this.fetchUser();
          return { success: true };
        }
        return { success: false, error: response.data.message };
      } catch (error) {
        console.error('Google callback error:', error);
        return { 
          success: false, 
          error: error.response?.data?.message || 'Failed to authenticate with Google'
        };
      }
    },

    async googleLogin() {
      const config = useRuntimeConfig();
      try {
        if (process.client) {
          sessionStorage.setItem('googleLoginInitiated', Date.now().toString());
        }
        // Add /v1 to the path
        window.location.href = `${config.public.apiBase}/v1/users/auth/google`;
      } catch (error) {
        console.error('Google login error:', error);
        return { 
          success: false, 
          error: 'Failed to initiate Google login'
        };
      }
    },

    clearUser() {
      this.user = null;
      this.authProvider = null;
      this.isInitialized = true;
      this.isLoading = false;
      
      // Clear any stored OAuth state
      if (process.client) {
        sessionStorage.removeItem('googleLoginInitiated');
      }
    }
  },
})

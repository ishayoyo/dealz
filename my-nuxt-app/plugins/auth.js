import { useAuthStore } from '~/stores/auth'
import api from '~/services/api'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  
  let isRefreshing = false
  let failedQueue = []

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve(token)
      }
    })
    failedQueue = []
  }

  api.interceptors.request.use(
    config => {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    response => {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      return response;
    },
    async error => {
      console.error(`❌ API Error: ${error.config.method?.toUpperCase()} ${error.config.url}`, error.response?.status);

      const originalRequest = error.config;

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log('🔄 Request queued while token refresh in progress');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            console.log('✅ Retrying queued request');
            return api(originalRequest);
          })
          .catch(err => {
            console.error('❌ Queued request failed:', err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting token refresh');
        const refreshed = await authStore.refreshToken();
        
        if (refreshed) {
          console.log('✅ Token refresh successful');
          processQueue(null);
          return api(originalRequest);
        } else {
          console.log('❌ Token refresh failed');
          processQueue(new Error('Refresh failed'));
          await authStore.clearUser();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        processQueue(refreshError);
        await authStore.clearUser();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
})

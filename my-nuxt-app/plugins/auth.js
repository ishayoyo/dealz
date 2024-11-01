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
      if (!config.url.includes('/users/me') && !config.url.includes('/users/refresh-token')) {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    error => Promise.reject(error)
  );

  api.interceptors.response.use(
    response => {
      if (!response.config.url.includes('/users/me') && !response.config.url.includes('/users/refresh-token')) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    async error => {
      const originalRequest = error.config;
      
      const isAuthEndpoint = originalRequest.url.includes('/users/me') || 
                            originalRequest.url.includes('/users/refresh-token');
      
      if (!isAuthEndpoint) {
        console.error(`❌ API Error: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
          status: error.response?.status,
          message: error.response?.data?.message
        });
      }

      if (error.response?.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url.includes('/users/login')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshed = await authStore.refreshToken();
          if (refreshed) {
            processQueue(null);
            return api(originalRequest);
          } else {
            processQueue(new Error('Refresh failed'));
            await authStore.clearUser();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError);
          await authStore.clearUser();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
})

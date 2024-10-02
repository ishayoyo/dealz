import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

const isProduction = process.env.NODE_ENV === 'production'

export const api = axios.create({
  baseURL: isProduction 
    ? 'https://deals.ishay.me/api/v1'
    : 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

if (process.client) {
  api.interceptors.request.use(config => {
    const token = useCookie('auth_token').value
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({resolve, reject})
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/users/refresh-token');
        const { token } = response.data;
        
        if (token) {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          processQueue(null, token);
          return api(originalRequest);
        } else {
          processQueue(new Error('No new token received'), null);
          if (process.client) {
            const authStore = useAuthStore();
            authStore.logout();
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (process.client) {
          const authStore = useAuthStore();
          authStore.logout();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

console.log('API baseURL:', api.defaults.baseURL)

export default api
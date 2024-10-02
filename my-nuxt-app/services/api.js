import axios from 'axios'

const isProduction = process.env.NODE_ENV === 'production'

export const api = axios.create({
  baseURL: isProduction 
    ? 'https://deals.ishay.me/api/v1'
    : 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Added for sending cookies
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call the refresh token endpoint
        await api.post('/users/refresh-token');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (process.client) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

console.log('API baseURL:', api.defaults.baseURL)

export default api
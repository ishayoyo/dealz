import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Make sure this matches your backend URL
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add an error interceptor to handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      // You might want to redirect to login page here
    }
    return Promise.reject(error)
  }
)

export default api
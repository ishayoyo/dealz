import axios from 'axios'

const isProduction = process.env.NODE_ENV === 'production'

export const api = axios.create({
  baseURL: isProduction 
    ? 'https://dealz-z1n5.onrender.com/api/v1'
    : 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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

console.log('API baseURL:', api.defaults.baseURL)

export default api
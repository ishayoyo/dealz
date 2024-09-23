import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Adjust this to match your API URL
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)

export default api
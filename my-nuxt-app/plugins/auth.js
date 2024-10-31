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

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // If it's not 401 or request already retried, reject immediately
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        console.log('🔄 Request queued while token refresh in progress')
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            console.log('✅ Retrying request after queue resolution')
            return api(originalRequest)
          })
          .catch((err) => {
            console.log('❌ Queued request failed:', err)
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        console.log('🔄 Attempting token refresh...')
        const refreshed = await authStore.refreshToken()
        
        if (refreshed) {
          console.log('✅ Token refresh successful')
          processQueue(null)
          return api(originalRequest)
        } else {
          console.log('❌ Token refresh failed')
          processQueue(new Error('Refresh failed'))
          await authStore.logout()
          return Promise.reject(error)
        }
      } catch (refreshError) {
        console.log('❌ Token refresh error:', refreshError)
        processQueue(refreshError)
        await authStore.logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )
})

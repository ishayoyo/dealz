import { useAuthStore } from '~/stores/auth'
import api from '~/services/api'  // Import the api instance
import { useRoute } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    const authStore = useAuthStore()
    
    // Initialize auth state immediately
    await authStore.initializeAuth()
    
    // Set up API interceptor
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true
          try {
            if (!authStore.isGoogleAuth) {
              await authStore.refreshToken()
              return api(error.config)
            }
          } catch (refreshError) {
            await authStore.logout()
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }
})

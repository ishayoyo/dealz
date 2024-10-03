import { useAuthStore } from '~/stores/auth'
import api from '~/services/api'  // Import the api instance

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()

  // Initialize auth state
  await authStore.initializeAuth()

  // Use the imported api instance instead of $axios
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && !error.config._retry) {
        error.config._retry = true
        try {
          await authStore.refreshToken()
          return api(error.config)
        } catch (refreshError) {
          await authStore.logout()
          return Promise.reject(refreshError)
        }
      }
      return Promise.reject(error)
    }
  )

  nuxtApp.hook('page:start', async () => {
    if (!authStore.isAuthenticated) {
      try {
        await authStore.checkAuth()
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
  })

  console.log('Auth plugin: isAuthenticated =', authStore.isAuthenticated)
  nuxtApp.provide('auth', authStore)
})
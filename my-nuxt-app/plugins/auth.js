import { useAuthStore } from '~/stores/auth'
import api from '~/services/api'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.client) {
    const authStore = useAuthStore()
    
    // Set up API interceptor first
    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Don't log 401s from /users/me endpoint
        if (error.response?.status === 401) {
          if (!error.config.url.includes('/users/me')) {
            if (!error.config._retry) {
              error.config._retry = true
              try {
                if (!authStore.isGoogleAuth) {
                  await authStore.refreshToken()
                  return api(error.config)
                }
              } catch (refreshError) {
                await authStore.logout()
              }
            }
            console.error('Authentication error:', error)
          }
        }
        return Promise.reject(error)
      }
    )

    // Initialize auth state only once
    nuxtApp.hook('app:mounted', async () => {
      await authStore.initializeAuth()
    })
  }
})

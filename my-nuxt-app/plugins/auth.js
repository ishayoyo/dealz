import { useAuthStore } from '~/stores/auth'
import api from '~/services/api'  // Import the api instance

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('Auth plugin: Starting initialization')
  const authStore = useAuthStore()

  if (process.client) {
    try {
      await authStore.initializeAuth()
      console.log('Auth plugin: initializeAuth completed')

      // Set up interceptor only on the client side
      api.interceptors.response.use(
        (response) => response,
        async (error) => {
          console.log('Auth plugin: Interceptor caught an error', error.response?.status)
          if (error.response?.status === 401 && !error.config._retry && authStore.isAuthenticated) {
            error.config._retry = true
            try {
              await authStore.refreshToken()
              return api(error.config)
            } catch (refreshError) {
              console.error('Auth plugin: Refresh token failed', refreshError)
              await authStore.logout()
              return Promise.reject(refreshError)
            }
          }
          return Promise.reject(error)
        }
      )

      console.log('Auth plugin: Interceptor set up')
    } catch (error) {
      console.error('Auth plugin: Error during initialization', error)
    }
  }

  console.log('Auth plugin: isAuthenticated =', authStore.isAuthenticated)
  nuxtApp.provide('auth', authStore)
})
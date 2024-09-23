// plugins/auth-check.js
export default defineNuxtPlugin(async (nuxtApp) => {
    const authStore = useAuthStore()
    const { $cookies } = useNuxtApp()
  
    // Use useCookie instead of localStorage
    const token = useCookie('auth_token')
  
    if (process.client && token.value) {
      try {
        await authStore.fetchUser()
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Handle the error (e.g., redirect to login page)
      }
    }
  })
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  
  // Only run initializeAuth on client-side
  if (process.client) {
    await authStore.initializeAuth()
  }
})
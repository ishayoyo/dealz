import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Only run on client-side
  if (process.server) return

  const authStore = useAuthStore()
  let initialized = false

  // Initialize auth once when the app starts
  nuxtApp.hook('app:mounted', async () => {
    if (!initialized) {
      console.log('🔐 Initial auth check')
      initialized = true
      await authStore.initializeAuth()
    }
  })
}) 
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()

  // Initialize auth state
  await authStore.initializeAuth()

  // Add auth store to the context for easy access in components
  nuxtApp.provide('auth', authStore)
})
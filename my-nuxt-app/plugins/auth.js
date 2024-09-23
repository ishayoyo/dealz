import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  await authStore.initializeAuth()
})
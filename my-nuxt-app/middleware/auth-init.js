export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const authStore = useAuthStore();
    if (!authStore.isInitialized) {
      await authStore.initializeAuth();
    }
  }
});

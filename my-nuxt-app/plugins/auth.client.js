import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.server) return;

  const authStore = useAuthStore();
  let initialized = false;

  nuxtApp.hook('app:mounted', async () => {
    if (!initialized) {
      initialized = true;
      await authStore.initializeAuth();
    }
  });
}); 
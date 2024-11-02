<template>
  <div class="app-wrapper">
    <Transition name="fade-slow">
      <SiteLoader v-if="isLoading" />
    </Transition>
    
    <Transition name="fade-slow">
      <div v-show="!isLoading" class="app-content">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const isLoading = ref(true)
const authStore = useAuthStore()

onMounted(async () => {
  try {
    await authStore.initializeAuth()
    await new Promise(resolve => setTimeout(resolve, 1500))
  } catch (error) {
    console.error('Initial load error:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
</style>
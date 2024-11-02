<template>
  <div>
    <SiteLoader v-if="isLoading" />
    <div v-show="!isLoading">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isLoading = ref(true)

onMounted(() => {
  // Simulate loading time or wait for resources
  setTimeout(() => {
    isLoading.value = false
  }, 2000) // Adjust timing as needed
})
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
</style>
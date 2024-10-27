<template>
  <div 
    v-if="!isAuthenticated" 
    class="fixed top-0 left-0 right-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white h-10 z-50"
  >
    <div class="container mx-auto px-4 h-full flex items-center justify-center">
      <p class="text-sm">
        <span class="font-bold">🎉 Welcome!</span> 
        <span class="font-heading">Join our community of deal hunters today.</span> 
        <button 
          @click="$emit('open-auth-modal', 'signup')" 
          class="underline hover:no-underline ml-2 font-semibold"
        >
          Sign up now
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

defineEmits(['open-auth-modal'])
</script>

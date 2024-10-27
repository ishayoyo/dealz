<template>
  <ClientOnly>
    <div 
      v-if="!isAuthenticated" 
      class="fixed top-0 left-0 right-0 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 sm:py-2.5 z-50"
    >
      <div class="container mx-auto px-4 h-full flex items-center justify-center">
        <p class="text-xs sm:text-sm text-center">
          <span class="font-bold block sm:inline">🎉 Welcome!</span> 
          <span class="font-heading hidden sm:inline">Join our community of deal hunters today.</span>
          <span class="font-heading sm:hidden">Join our community today.</span>
          <button 
            @click="$emit('open-auth-modal', 'signup')" 
            class="underline hover:no-underline ml-1 sm:ml-2 font-semibold whitespace-nowrap"
          >
            Sign up now
          </button>
        </p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

defineEmits(['open-auth-modal'])
</script>

<!-- my-nuxt-app/components/ForgotPasswordModal.vue -->
<template>
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-center text-primary-600">
        Reset Your Password
      </h2>
      
      <p class="text-center text-gray-600 mb-6">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
  
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
            required
          >
        </div>
  
        <div v-if="error" class="mt-4 text-red-500 text-center">
          {{ error }}
        </div>
  
        <button 
          type="submit" 
          class="w-full btn btn-primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Sending...' : 'Send Reset Instructions' }}
        </button>
      </form>
  
      <p class="mt-4 text-center text-gray-600">
        <a href="#" @click.prevent="$emit('close')" class="text-primary-600 hover:underline">
          Back to Login
        </a>
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useToastification } from '~/composables/useToastification'
  
  const authStore = useAuthStore()
  const toast = useToastification()
  
  const email = ref('')
  const error = ref(null)
  const isSubmitting = ref(false)
  
  const handleSubmit = async () => {
    try {
      error.value = null
      isSubmitting.value = true
      const result = await authStore.forgotPassword(email.value)
      if (result.success) {
        toast.success('Password reset instructions sent. Please check your email.')
        email.value = ''
      } else {
        error.value = result.error || 'Failed to send reset instructions. Please try again.'
        toast.error(error.value)
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      error.value = err.message || 'An unexpected error occurred. Please try again.'
      toast.error(error.value)
    } finally {
      isSubmitting.value = false
    }
  }
  </script>
  
  <style scoped>
  .btn-primary {
    @apply bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300 shadow-md hover:shadow-lg;
  }
  
  .btn-primary:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
  </style>
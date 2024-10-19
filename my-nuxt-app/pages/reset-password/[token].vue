<template>
    <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-indigo-900">
            Reset Password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Please enter your new password.
          </p>
        </div>
        <div v-if="isResetting" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p class="mt-4 text-indigo-600">Resetting your password...</p>
        </div>
        <form v-if="!isReset" class="mt-8 space-y-6" @submit.prevent="resetPassword">
          <div>
            <label for="new-password" class="sr-only">New Password</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              required
              class="input-field"
              placeholder="Enter new password"
              minlength="8"
              title="Password must be at least 8 characters long"
            >
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              class="input-field"
              placeholder="Confirm new password"
              minlength="8"
              title="Please confirm your new password"
            >
          </div>
          <div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="btn btn-primary w-full text-white"
            >
              {{ isSubmitting ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
        <div v-if="error" class="mt-4 text-center text-red-600">
          {{ error }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useAuthStore } from '~/stores/auth'
  import { useToastification } from '~/composables/useToastification'
  import { useRouter, useRoute } from '#app'
  
  const authStore = useAuthStore()
  const toast = useToastification()
  const router = useRouter()
  const route = useRoute()
  
  const newPassword = ref('')
  const confirmPassword = ref('')
  const isResetting = ref(false)
  const isReset = ref(false)
  const error = ref('')
  const isSubmitting = ref(false)
  
  const resetToken = route.params.token
  
  const resetPassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
      error.value = 'Passwords do not match.'
      toast.error(error.value)
      return
    }

    isSubmitting.value = true
    isResetting.value = true
    error.value = ''
    try {
      console.log('Attempting to reset password with token:', resetToken)
      const result = await authStore.resetPassword(resetToken, newPassword.value, confirmPassword.value)
      console.log('Reset password result:', result)
      if (result.success) {
        isReset.value = true
        toast.success('Password reset successfully!')
        // Redirect to homepage after successful reset
        router.push('/')
      } else {
        error.value = result.error || 'Password reset failed. Please try again.'
        toast.error(error.value)
      }
    } catch (err) {
      console.error('Error in resetPassword:', err)
      error.value = 'An error occurred during password reset.'
      toast.error(error.value)
    } finally {
      isSubmitting.value = false
      isResetting.value = false
    }
  }
  </script>

<style scoped>
.btn-primary {
  color: white;
}
</style>

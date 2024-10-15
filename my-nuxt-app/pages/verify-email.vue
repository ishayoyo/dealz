<template>
  <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          Email Verification
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please enter the verification code sent to your email.
        </p>
      </div>
      <div v-if="isVerifying" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p class="mt-4 text-indigo-600">Verifying your email...</p>
      </div>
      <form v-if="!isVerified" class="mt-8 space-y-6" @submit.prevent="verifyEmail">
        <div>
          <label for="verification-code" class="sr-only">Verification Code</label>
          <input
            id="verification-code"
            v-model="verificationCode"
            type="text"
            required
            class="input-field"
            placeholder="Enter 6-character code"
            maxlength="6"
            title="Please enter the 6-character verification code"
          >
        </div>
        <div>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="btn btn-primary w-full"
          >
            {{ isSubmitting ? 'Verifying...' : 'Verify Email' }}
          </button>
        </div>
      </form>
      <div v-if="error" class="mt-4 text-center text-red-600">
        {{ error }}
      </div>
      <div class="mt-6 text-center">
        <button
          @click="resendVerificationEmail"
          :disabled="isResending"
          class="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {{ isResending ? 'Resending...' : 'Resend Verification Email' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from '#app'

const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()

const verificationCode = ref('')
const isVerifying = ref(false)
const isVerified = ref(false)
const error = ref('')
const isSubmitting = ref(false)
const isResending = ref(false)

const verifyEmail = async () => {
  isSubmitting.value = true
  isVerifying.value = true
  error.value = ''
  try {
    const result = await authStore.verifyEmail(verificationCode.value)
    if (result.success) {
      isVerified.value = true
      toast.success('Email verified successfully!')
      // Redirect to homepage after successful verification
      router.push('/')
    } else {
      error.value = result.error || 'Verification failed. Please try again.'
      toast.error(error.value)
    }
  } catch (err) {
    error.value = 'An error occurred during verification.'
    toast.error(error.value)
  } finally {
    isSubmitting.value = false
    isVerifying.value = false
  }
}

const resendVerificationEmail = async () => {
  isResending.value = true
  try {
    const result = await authStore.resendVerificationEmail()
    if (result.success) {
      toast.success('Verification email resent successfully!')
    } else {
      toast.error(result.error || 'Failed to resend verification email.')
    }
  } catch (err) {
    toast.error('An error occurred while resending the verification email.')
  } finally {
    isResending.value = false
  }
}
</script>

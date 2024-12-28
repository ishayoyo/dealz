<template>
  <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
    <div class="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl transform transition-all">
      <!-- Header Section -->
      <div class="text-center">
        <!-- Email SVG icon -->
        <div class="mb-6">
          <svg class="w-20 h-20 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Verify Your Email
        </h2>
        <p v-if="isVerified" class="text-green-600 font-medium">
          Your email is verified. You can now use all features of the application.
        </p>
        <p v-else class="text-gray-600 max-w-sm mx-auto">
          We've sent a verification code to your email. Please enter it below to complete your registration.
        </p>
      </div>

      <!-- Verification Form -->
      <div v-if="isVerifying" class="text-center my-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-primary-600 font-medium">Verifying your email...</p>
      </div>

      <form v-if="!isVerified" class="mt-8 space-y-6" @submit.prevent="verifyEmail">
        <!-- Verification Code Input -->
        <div>
          <label for="verification-code" class="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="verification-code"
            v-model="verificationCode"
            type="text"
            required
            class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            :class="{
              'border-gray-200': !error,
              'border-red-200 bg-red-50': error
            }"
            placeholder="Enter 6-digit code"
            maxlength="6"
            title="Please enter the 6-digit verification code"
          >
        </div>

        <!-- Verify Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Verifying...
          </span>
          <span v-else>Verify Email</span>
        </button>
      </form>

      <!-- Resend Section -->
      <div v-if="!isVerified" class="mt-8">
        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500">Didn't receive the code?</span>
          </div>
        </div>

        <form @submit.prevent="resendVerificationEmail" class="space-y-4">
          <div>
            <label for="resend-email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="resend-email"
              v-model="resendEmail"
              type="email"
              required
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your email address"
            >
          </div>

          <!-- Resend Button -->
          <button
            type="submit"
            :disabled="!canResend || isResending || !resendEmail"
            class="w-full py-3 px-4 rounded-xl font-medium border-2 border-primary-600 text-primary-600 hover:bg-primary-50 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isResending ? 'Sending...' : 
               !canResend ? `Resend available in ${resendCooldown}s` : 
               'Resend Verification Code' }}
          </button>
        </form>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
        <p class="text-center text-red-600 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter, useRoute } from '#app'

const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()
const route = useRoute()

const verificationCode = ref('')
const resendEmail = ref('')
const isVerifying = ref(false)
const isVerified = ref(false)
const error = ref('')
const isSubmitting = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)
const canResend = computed(() => resendCooldown.value === 0)

onMounted(async () => {
  // Check for verification token in URL
  const token = route.query.token
  if (token) {
    isVerifying.value = true
    error.value = ''
    try {
      const result = await authStore.verifyEmailToken(token)
      if (result.success) {
        isVerified.value = true
        toast.success('Email verified successfully!')
        // Redirect to home after short delay
        setTimeout(() => router.push('/'), 2000)
      } else {
        error.value = result.error || 'Verification failed. Please try again.'
        toast.error(error.value)
      }
    } catch (err) {
      error.value = 'An error occurred during verification.'
      toast.error(error.value)
    } finally {
      isVerifying.value = false
    }
  } else {
    try {
      const result = await authStore.checkVerificationStatus();
      if (result.isVerified) {
        toast.success('Your email is already verified!');
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  }
});

const verifyEmail = async () => {
  isSubmitting.value = true
  isVerifying.value = true
  error.value = ''
  try {
    const result = await authStore.verifyEmail(verificationCode.value)
    if (result.success) {
      isVerified.value = true
      toast.success('Email verified successfully!')
      router.push('/')
    } else if (result.alreadyVerified) {
      toast.info('Your email is already verified!')
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
  if (!canResend.value || !resendEmail.value) return

  isResending.value = true
  error.value = ''
  try {
    const result = await authStore.resendVerificationEmail(resendEmail.value)
    if (result.success) {
      toast.info('A new verification link has been sent to your email.')
      verificationCode.value = '' // Reset the input field
      startResendCooldown()
    } else {
      error.value = result.error
      toast.error(error.value)
    }
  } catch (err) {
    error.value = 'An error occurred. Please try again later.'
    toast.error(error.value)
  } finally {
    isResending.value = false
  }
}

const startResendCooldown = () => {
  resendCooldown.value = 60 // 60 seconds cooldown
  const timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value === 0) {
      clearInterval(timer)
    }
  }, 1000)
}
</script>


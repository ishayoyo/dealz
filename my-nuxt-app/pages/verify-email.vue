<template>
  <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-indigo-900">
          Email Verification
        </h2>
        <p v-if="isVerified" class="mt-2 text-center text-sm text-green-600">
          Your email is verified. You can now use all features of the application.
        </p>
        <p v-else class="mt-2 text-center text-sm text-gray-600">
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
      <div v-if="!isVerified" class="mt-6">
        <h3 class="text-center text-lg font-medium text-gray-900">Resend Verification Email</h3>
        <form @submit.prevent="resendVerificationEmail" class="mt-2 space-y-4">
          <div>
            <label for="resend-email" class="sr-only">Email address</label>
            <input
              id="resend-email"
              v-model="resendEmail"
              type="email"
              required
              class="input-field"
              placeholder="Enter your email address"
            >
          </div>
          <div>
            <button
              type="submit"
              :disabled="!canResend || isResending || !resendEmail"
              class="btn btn-secondary w-full"
            >
              {{ isResending ? 'Sending...' : 
                 !canResend ? `Resend in ${resendCooldown}s` : 
                 'Resend Verification Email' }}
            </button>
          </div>
        </form>
      </div>
      <div v-if="error" class="mt-4 text-center text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from '#app'

const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()

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
  try {
    const result = await authStore.checkVerificationStatus(resendEmail.value);
    if (result.isVerified) {
      toast.success('Your email is already verified!');
      router.push('/');
    }
  } catch (error) {
    console.error('Error checking verification status:', error);
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
      toast.info(result.message)
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


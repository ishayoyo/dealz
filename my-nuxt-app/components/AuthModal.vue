<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg w-full max-w-md p-6 sm:p-8 relative shadow-lg">
      <!-- Close button -->
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Modal title -->
      <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-center text-primary-600">
        {{ isLogin ? 'Welcome Back!' : 'Join the Savings Squad!' }}
      </h2>
      
      <!-- Modal subtitle -->
      <p class="text-center text-gray-600 mb-6">
        {{ isLogin ? 'Your fellow shoppers are waiting for your amazing deals!' : 'Unlock a world of incredible deals and start saving today!' }}
      </p>

      <!-- Auth form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Username input (only for signup) -->
        <div v-if="!isLogin">
          <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            @input="validateUsername"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
            :class="{'border-red-500': usernameError, 'border-green-500': isUsernameValid && form.username.length > 0}"
            required
          >
          <p v-if="!isLogin && form.username.length > 0" class="text-sm mt-1" :class="isUsernameValid ? 'text-green-500' : 'text-red-500'">
            {{ usernameFeedback }}
          </p>
        </div>
        
        <!-- Email input -->
        <div>
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            @input="validateEmail"
            autocomplete="username"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
            :class="{'border-red-500': emailError, 'border-green-500': isEmailValid && form.email.length > 0}" 
            required
          >
          <p v-if="!isLogin && form.email.length > 0" class="text-sm mt-1" :class="isEmailValid ? 'text-green-500' : 'text-red-500'">
            {{ emailFeedback }}
          </p>
        </div>
        
        <!-- Password input -->
        <div>
          <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            @input="validatePassword"
            autocomplete="current-password" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
            :class="{'border-red-500': passwordError, 'border-green-500': isPasswordValid && form.password.length > 0}" 
            required
          >
          <p v-if="!isLogin && form.password.length > 0" class="text-sm mt-1" :class="isPasswordValid ? 'text-green-500' : 'text-red-500'">
            {{ passwordFeedback }}
          </p>
        </div>
        
        <!-- Error messages -->
        <div v-if="isLogin && authStore.loginCountdown > 0" class="mt-4 text-red-500 text-center">
          Too many login attempts. Please try again in {{ formatCountdown(authStore.loginCountdown) }}.
        </div>
        <div v-else-if="!isLogin && authStore.signupCountdown > 0" class="mt-4 text-red-500 text-center">
          Too many signup attempts. Please try again in {{ formatCountdown(authStore.signupCountdown) }}.
        </div>
        <div v-else-if="isLogin && authStore.loginAttemptsLeft > 0 && authStore.loginAttemptsLeft < 5" class="mt-4 text-yellow-500 text-center">
          You have {{ authStore.loginAttemptsLeft }} login {{ authStore.loginAttemptsLeft === 1 ? 'attempt' : 'attempts' }} left.
        </div>
        <div v-else-if="error" class="mt-4 text-red-500 text-center">
          {{ error }}
        </div>

        <!-- Submit button -->
        <button 
          type="submit" 
          class="w-full btn btn-primary"
          :disabled="!isPasswordValid || !isEmailValid || isSubmitting || (isLogin ? authStore.loginCountdown > 0 : authStore.signupCountdown > 0)"
        >
          {{ isSubmitting ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up') }}
        </button>
      </form>
      
      <!-- Toggle between login and signup -->
      <p class="mt-4 text-center text-gray-600">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <a href="#" @click.prevent="toggleAuthMode" class="text-primary-600 hover:underline">
          {{ isLogin ? 'Sign Up' : 'Log In' }}
        </a>
      </p>

      <!-- New verification code input -->
      <div v-if="showVerificationForm">
        <h2>Verify Your Email</h2>
        <p>We've sent a verification code to your email. Please enter it below:</p>
        <input v-model="verificationCode" placeholder="Enter verification code" />
        <button @click="verifyEmail">Verify</button>
        <button @click="resendVerificationEmail">Resend Code</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'

// Initialize composables
const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()

// Props and emits
const props = defineProps({
  isLogin: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['close'])

// Form data
const form = reactive({
  username: '',
  email: '',
  password: ''
})

// Form validation
const isUsernameValid = computed(() => /^[a-zA-Z0-9_]{3,20}$/.test(form.username))
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
const isPasswordValid = computed(() => form.password.length >= 8)

const usernameFeedback = computed(() => isUsernameValid.value ? 'Valid username' : 'Username must be 3-20 characters long and contain only letters, numbers, and underscores')
const emailFeedback = computed(() => isEmailValid.value ? 'Valid email' : 'Please enter a valid email address')
const passwordFeedback = computed(() => isPasswordValid.value ? 'Valid password' : 'Password must be at least 8 characters long')

const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')

const isLogin = ref(props.isLogin)
const error = ref(null)
const isSubmitting = ref(false)

// Toggle between login and signup
const toggleAuthMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
}

// Validation functions
const validatePassword = () => {
  passwordError.value = isPasswordValid.value ? '' : 'Invalid password'
}

const validateEmail = () => {
  emailError.value = isEmailValid.value ? '' : 'Invalid email address'
}

const validateUsername = () => {
  usernameError.value = isUsernameValid.value ? '' : 'Invalid username'
}

// Handle form submission
const handleSubmit = async () => {
  if (isLogin.value && authStore.loginCountdown > 0) {
    error.value = `Too many login attempts. Please try again in ${formatCountdown(authStore.loginCountdown)}.`
    toast.error(error.value)
    return
  }

  if (!isLogin.value && authStore.signupCountdown > 0) {
    error.value = `Too many signup attempts. Please try again in ${formatCountdown(authStore.signupCountdown)}.`
    toast.error(error.value)
    return
  }

  try {
    error.value = null
    isSubmitting.value = true

    if (isLogin.value) {
      await handleLogin()
    } else {
      await handleSignup()
    }
  } catch (err) {
    handleError(err)
  } finally {
    isSubmitting.value = false
  }
}

// Handle login
const handleLogin = async () => {
  if (authStore.loginCountdown > 0) {
    error.value = `Too many login attempts. Please try again in ${formatCountdown(authStore.loginCountdown)}.`
    toast.error(error.value)
    return
  }

  try {
    error.value = null
    isSubmitting.value = true
    const result = await authStore.login(form.email, form.password)
    if (result.success) {
      toast.success('Logged in successfully!')
      emit('close')
    } else if (result.requiresVerification) {
      toast.info(result.message)
      showVerificationForm.value = true
    } else {
      error.value = result.error
      if (result.attemptsLeft !== undefined) {
        if (result.attemptsLeft > 0) {
          error.value += ` You have ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
        } else {
          error.value = 'Too many login attempts. Please try again later.'
        }
      }
      toast.error(error.value)
    }
  } catch (err) {
    handleError(err)
  } finally {
    isSubmitting.value = false
  }
}

// Handle signup
const handleSignup = async () => {
  if (authStore.signupCountdown > 0) {
    error.value = `Too many signup attempts. Please try again in ${formatCountdown(authStore.signupCountdown)}.`
    toast.error(error.value)
    return
  }

  try {
    error.value = null
    isSubmitting.value = true
    const result = await authStore.signup({
      username: form.username,
      email: form.email,
      password: form.password
    })
    if (result.success) {
      toast.success(result.message || 'Signup successful. Please check your email for the verification code.')
      navigateTo('/verify-email')
      emit('close')
    } else {
      toast.error(result.error || 'Signup failed. Please check your information and try again.')
    }
  } catch (err) {
    handleError(err)
  } finally {
    isSubmitting.value = false
  }
}

// Add a new ref for showing verification instructions
const showVerificationInstructions = ref(false)

// Handle errors
const handleError = (err) => {
  console.error('Auth error:', err)
  if (err.response && err.response.status === 429) {
    error.value = `Too many attempts. Please try again in ${formatCountdown(authStore.loginCountdown)}.`
  } else {
    error.value = err.message || 'An unexpected error occurred. Please try again.'
  }
  if (isLogin.value && authStore.loginAttemptsLeft > 0 && authStore.loginAttemptsLeft < 5) {
    error.value += ` You have ${authStore.loginAttemptsLeft} ${authStore.loginAttemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
  }
  toast.error(error.value)
}

// Format countdown time
const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (newValue) => {
  if (newValue) {
    emit('close')
    // Uncomment the following line if you want to redirect after login
    // router.push('/dashboard')
  }
})

// Check authentication status on component mount
onMounted(() => {
  if (authStore.isAuthenticated) {
    const currentRoute = router.currentRoute.value
    if (currentRoute.meta.requiresAuth) {
      router.push('/')
    }
  }
})

// Clean up timers when component is unmounted
onUnmounted(() => {
  authStore.clearTimers()
})

const showSignupForm = ref(true)
const showVerificationForm = ref(false)
const verificationCode = ref('')

const verifyEmail = async () => {
  try {
    isSubmitting.value = true
    const result = await authStore.verifyEmail(verificationCode.value)
    if (result.success) {
      toast.success('Email verified successfully!')
      emit('close')
    } else {
      toast.error(result.error || 'Verification failed. Please try again.')
    }
  } catch (err) {
    handleError(err)
  } finally {
    isSubmitting.value = false
  }
}

const resendVerificationEmail = async () => {
  try {
    const result = await authStore.resendVerificationEmail()
    if (result.success) {
      toast.success('Verification code resent. Please check your email.')
    } else {
      toast.error(result.error || 'Failed to resend verification code.')
    }
  } catch (err) {
    handleError(err)
  }
}
</script>

<style scoped>
.fixed {
  z-index: 1000;
}

.btn-primary {
  @apply bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300 shadow-md hover:shadow-lg;
}

.btn-primary:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>

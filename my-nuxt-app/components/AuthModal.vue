<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl w-full max-w-[340px] sm:max-w-md p-4 sm:p-8 relative shadow-2xl transform transition-all">
      <!-- Close button - styled more elegantly -->
      <button @click="$emit('close')" class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Auth form -->
      <div v-if="!showForgotPassword">
        <!-- Enhanced title with gradient text -->
        <h2 class="text-2xl sm:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          {{ isLogin ? 'Welcome Back! 👋' : 'Join Our Community! 🎉' }}
        </h2>
        
        <!-- Enhanced subtitle -->
        <p class="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base max-w-sm mx-auto">
          {{ isLogin 
            ? 'Great to see you again! Ready to discover more amazing deals?' 
            : 'Join thousands of smart shoppers and start saving today!' 
          }}
        </p>

        <!-- Google Sign In Button moved to top for better visibility -->
        <button 
          @click="handleGoogleLogin"
          type="button"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-all duration-200 mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.24 24.0008C15.4764 24.0008 18.2058 22.9382 20.1944 21.1039L16.3274 18.1055C15.2516 18.8375 13.8626 19.252 12.24 19.252C9.0792 19.252 6.4034 17.1399 5.4414 14.3003H1.4474V17.3912C3.4034 21.4434 7.5034 24.0008 12.24 24.0008Z" fill="#34A853"/>
            <path d="M5.4414 14.3003C5.2022 13.5681 5.0676 12.7862 5.0676 12.0008C5.0676 11.2154 5.2022 10.4335 5.4414 9.70129V6.61029H1.4474C0.5244 8.23129 0 10.0682 0 12.0008C0 13.9334 0.5244 15.7703 1.4474 17.3913L5.4414 14.3003Z" fill="#FBBC04"/>
            <path d="M12.24 4.74966C14.0258 4.74966 15.6234 5.35843 16.8954 6.56966L20.2698 3.19523C18.2002 1.21523 15.4764 0 12.24 0C7.5034 0 3.4034 2.55733 1.4474 6.61029L5.4414 9.70129C6.4034 6.86166 9.0792 4.74966 12.24 4.74966Z" fill="#EA4335"/>
          </svg>
          <span class="font-medium">Continue with Google</span>
        </button>

        <!-- Divider with enhanced styling -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500 text-sm">or continue with email</span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Enhanced input fields with better visual feedback -->
          <div v-if="!isLogin">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              id="username" 
              v-model="form.username" 
              @input="validateUsername"
              class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{
                'border-red-200 bg-red-50': usernameError,
                'border-green-200 bg-green-50': isUsernameValid && form.username.length > 0,
                'border-gray-200': !usernameError && (!isUsernameValid || form.username.length === 0)
              }"
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

          <!-- Enhanced submit button -->
          <button 
            type="submit" 
            class="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            :disabled="!isPasswordValid || !isEmailValid || isSubmitting"
          >
            <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><!-- ... loading spinner SVG ... --></svg>
              Processing...
            </span>
            <span v-else>{{ isLogin ? 'Sign In' : 'Create Account' }}</span>
          </button>

          <!-- Enhanced toggle link -->
          <div class="mt-6 text-center space-y-2">
            <!-- Forgot Password link (only for login) -->
            <p v-if="isLogin" class="text-gray-600">
              <a href="#" @click.prevent="showForgotPassword = true" class="text-primary-600 hover:text-primary-700 hover:underline">
                Forgot Password?
              </a>
            </p>

            <!-- Single toggle auth mode link -->
            <p class="text-gray-600">
              {{ isLogin ? "New to our platform?" : "Already have an account?" }}
              <a 
                href="#" 
                @click.prevent="toggleAuthMode" 
                class="font-medium text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline ml-1"
              >
                {{ isLogin ? 'Sign up now' : 'Log in' }}
              </a>
            </p>
          </div>
        </form>
      </div>

      <!-- Forgot Password Modal -->
      <ForgotPasswordModal 
        v-if="showForgotPassword"
        @close="showForgotPassword = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'
import ForgotPasswordModal from './ForgotPasswordModal.vue'
import api from '~/services/api'  // Make sure to import your API service
import { useRuntimeConfig } from 'nuxt/app'

// Initialize composables
const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()
const config = useRuntimeConfig()

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

// Add this new ref
const showForgotPassword = ref(false)

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

const handleGoogleLogin = () => {
  authStore.googleLogin();
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

/* Add to your existing styles */
button {
  font-family: 'Roboto', sans-serif;
}
</style>


<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg w-full max-w-md p-6 sm:p-8 relative shadow-lg">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-center text-primary-600">
        {{ isLogin ? 'Welcome Back!' : 'Join the Savings Squad!' }}
      </h2>
      
      <p class="text-center text-gray-600 mb-6">
        {{ isLogin ? 'Your fellow shoppers are waiting for your amazing deals!' : 'Unlock a world of incredible deals and start saving today!' }}
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-4">
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
        
        <div v-if="error" class="mt-4 text-red-500 text-center">
          {{ error }}
          <div v-if="countdown > 0" class="mt-2 text-sm">
            You can try again in {{ Math.floor(countdown / 60) }}:{{ (countdown % 60).toString().padStart(2, '0') }} minutes.
          </div>
        </div>
        <button 
          type="submit" 
          class="w-full btn btn-primary"
          :disabled="!isPasswordValid || !isEmailValid || isSubmitting || countdown > 0"
        >
          {{ isSubmitting ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up') }}
        </button>
      </form>
      
      <p class="mt-4 text-center text-gray-600">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <a href="#" @click.prevent="toggleAuthMode" class="text-primary-600 hover:underline">
          {{ isLogin ? 'Sign Up' : 'Log In' }}
        </a>
      </p>
      
      <!-- Remove this duplicate error display -->
      <!-- <div v-if="error" class="mt-4 text-red-500 text-center">
        {{ error }}
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const toast = useToastification()
const router = useRouter()

const props = defineProps({
  isLogin: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const form = reactive({
  username: '',
  email: '',
  password: ''
})

const isLogin = ref(props.isLogin)
const error = ref(null)
const passwordError = ref('')
const isPasswordValid = computed(() => {
  return form.password.length >= 8
})
const passwordFeedback = computed(() => {
  if (form.password.length === 0) return ''
  if (form.password.length < 8) return 'Password must be at least 8 characters long'
  return 'Password meets the requirements'
})

const emailError = ref('')
const isEmailValid = computed(() => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(form.email)
})
const emailFeedback = computed(() => {
  if (form.email.length === 0) return ''
  if (!isEmailValid.value) return 'Please enter a valid email address'
  return 'Email is valid'
})

const usernameError = ref('')
const isUsernameValid = computed(() => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(form.username)
})
const usernameFeedback = computed(() => {
  if (form.username.length === 0) return ''
  if (form.username.length < 3) return 'Username must be at least 3 characters long'
  if (form.username.length > 20) return 'Username must be no more than 20 characters long'
  if (!isUsernameValid.value) return 'Username can only contain letters, numbers, and underscores'
  return 'Username is valid'
})

const toggleAuthMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
}

const validatePassword = () => {
  passwordError.value = isPasswordValid.value ? '' : 'Invalid password'
}

const validateEmail = () => {
  emailError.value = isEmailValid.value ? '' : 'Invalid email address'
}

const validateUsername = () => {
  usernameError.value = isUsernameValid.value ? '' : 'Invalid username'
}

const isSubmitting = ref(false)

const countdown = ref(0)
const countdownTimer = ref(null)

const startCountdown = (seconds) => {
  countdown.value = seconds
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer.value)
    }
  }, 1000)
}

const handleSubmit = async () => {
  try {
    error.value = null
    isSubmitting.value = true
    if (!isLogin.value) {
      if (!isUsernameValid.value) {
        error.value = 'Please enter a valid username'
        return
      }
      if (!isEmailValid.value) {
        error.value = 'Please enter a valid email address'
        return
      }
      if (!isPasswordValid.value) {
        error.value = 'Please enter a valid password'
        return
      }
    }
    if (isLogin.value) {
      const response = await authStore.login(form.email, form.password)
      if (response.success) {
        toast.success('Logged in successfully!')
        emit('close')
      } else {
        error.value = response.error || 'Login failed. Please check your credentials and try again.'
        toast.error(error.value)
      }
    } else {
      const response = await authStore.signup({
        username: form.username,
        email: form.email,
        password: form.password
      })
      if (response.success) {
        toast.success('Signed up successfully!')
        emit('close')
      } else {
        error.value = response.error || 'Signup failed. Please try again.'
        toast.error(error.value)
      }
    }
  } catch (err) {
    console.error('Auth error:', err)
    if (err.response && err.response.status === 429) {
      error.value = err.response.data.message || (isLogin.value
        ? 'Too many login attempts. Please try again later.'
        : 'Too many signup attempts. Please try again later.')
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        startCountdown(parseInt(retryAfter))
      } else {
        // Parse the time from the error message
        const minutes = parseInt(error.value.match(/\d+/)[0])
        if (!isNaN(minutes)) {
          startCountdown(minutes * 60)
        } else {
          startCountdown(180) // Default to 3 minutes if parsing fails
        }
      }
    } else {
      error.value = 'An unexpected error occurred. Please try again.'
    }
    toast.error(error.value)
  } finally {
    isSubmitting.value = false
  }
}

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (newValue) => {
  if (newValue) {
    emit('close')
    // You might want to redirect here if needed
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

onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})
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
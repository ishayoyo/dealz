<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-md p-8 relative">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h2 class="text-3xl font-bold mb-6 text-center text-blue-600">
        {{ isLogin ? 'Welcome Back!' : 'Join the Savings Squad!' }}
      </h2>
      
      <p class="text-center text-gray-600 mb-6">
        {{ isLogin ? 'Your fellow shoppers are waiting for your amazing deals!' : 'Unlock a world of incredible deals and start saving today!' }}
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="mb-4" v-if="!isLogin">
          <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input type="text" id="username" v-model="form.username" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        
        <div class="mb-4">
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            autocomplete="username"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required
          >
        </div>
        
        <div class="mb-6">
          <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input type="password" id="password" v-model="form.password" autocomplete="current-password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        
        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
          {{ isLogin ? 'Log In' : 'Sign Up' }}
        </button>
      </form>
      
      <p class="mt-4 text-center text-gray-600">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <a href="#" @click.prevent="toggleAuthMode" class="text-blue-600 hover:underline">
          {{ isLogin ? 'Sign Up' : 'Log In' }}
        </a>
      </p>
      
      <div v-if="error" class="mt-4 text-red-500 text-center">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const toast = useToast()
const router = useRouter()

const props = defineProps({
  isLogin: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'login', 'signup'])

const form = reactive({
  username: '',
  email: '',
  password: ''
})

const isLogin = ref(props.isLogin)
const error = ref(null)

const toggleAuthMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
}

const handleSubmit = async () => {
  try {
    error.value = null
    if (isLogin.value) {
      // Change this line
      emit('login', { email: form.email, password: form.password })
    } else {
      // Change this line
      emit('signup', {
        username: form.username,
        email: form.email,
        password: form.password
      })
    }
    emit('close')
  } catch (err) {
    console.error('Auth error:', err)
    error.value = err.message || 'An error occurred. Please try again.'
    toast.error(error.value)
  }
}

// Watch for authentication state changes
watch(() => authStore.isAuthenticated, (newValue) => {
  if (!newValue) {
    // If user becomes unauthenticated (e.g., token expired), close the modal
    emit('close')
    // No need to redirect, as the auth store will handle it
  }
})

// Check authentication status on component mount
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // If user is not authenticated, ensure they can't access protected routes
    const currentRoute = router.currentRoute.value
    if (currentRoute.meta.requiresAuth) {
      router.push('/')
    }
  }
})
</script>
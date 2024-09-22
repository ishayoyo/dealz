<template>
  <header class="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center">
        <NuxtLink to="/" class="text-xl font-bold mr-4 text-blue-600 hover:text-blue-800">
          Logo
        </NuxtLink>
        <input type="search" placeholder="Search deals..." class="bg-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex items-center">
        <template v-if="!isLoggedIn">
          <button @click="openAuthModal('login')" class="text-gray-600 hover:text-gray-800 mr-4">Log In</button>
          <button @click="openAuthModal('signup')" class="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600">Sign Up</button>
        </template>
        <template v-else>
          <button @click="openPostDealModal" class="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 mr-4">Post a Deal</button>
          <button @click="handleOpenProfile" class="text-gray-600 hover:text-gray-800 mr-4">
            <img v-if="user.profilePicture" :src="profilePictureUrl" alt="Profile" class="w-8 h-8 rounded-full object-cover">
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button class="text-gray-600 hover:text-gray-800 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </template>
        <button @click="toggleLogin" class="ml-4 bg-gray-200 text-gray-700 rounded-md px-4 py-2 hover:bg-gray-300">
          {{ isLoggedIn ? 'Logout' : 'Login' }}
        </button>
      </div>
    </div>
    <AuthModal v-if="showAuthModal" :is-login="isLoginMode" @close="closeAuthModal" @login="handleLogin" @signup="handleSignup" />
    <PostDealModal v-if="showPostDealModal" @close="closePostDealModal" @post-deal="handlePostDeal" />
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '~/services/api'
import AuthModal from './AuthModal.vue'
import PostDealModal from './PostDealModal.vue'
import { useProfileActions } from '~/composables/useProfile'
import { useRouter } from 'vue-router'

const isLoggedIn = ref(false)
const showAuthModal = ref(false)
const showPostDealModal = ref(false)
const isLoginMode = ref(true)

const { openProfile } = useProfileActions()
const router = useRouter()

const handleOpenProfile = () => {
  openProfile()
}

const toggleLogin = async () => {
  if (isLoggedIn.value) {
    try {
      await api.post('/users/logout')
      localStorage.removeItem('token')
      isLoggedIn.value = false
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  } else {
    openAuthModal('login')
  }
}

const openAuthModal = (mode) => {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const openPostDealModal = () => {
  showPostDealModal.value = true
}

const closePostDealModal = () => {
  showPostDealModal.value = false
}

const handleLogin = (userData) => {
  isLoggedIn.value = true
  // You might want to store user data in a global state here
  closeAuthModal()
}

const handleSignup = (userData) => {
  isLoggedIn.value = true
  // You might want to store user data in a global state here
  closeAuthModal()
}

const user = ref({})
const profilePictureUrl = computed(() => {
  if (user.value.profilePicture) {
    return user.value.profilePicture.startsWith('http')
      ? user.value.profilePicture
      : `http://localhost:5000${user.value.profilePicture}`
  }
  return null
})

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const response = await api.get('/users/me')
      user.value = response.data.data.user
      isLoggedIn.value = true
    } catch (error) {
      console.error('Error verifying token:', error)
      localStorage.removeItem('token')
      isLoggedIn.value = false
    }
  }
})

const handlePostDeal = (deal) => {
  console.log('Posted deal:', deal)
  closePostDealModal()
  // Optionally, you can refresh the deals list or add the new deal to the existing list
}
</script>
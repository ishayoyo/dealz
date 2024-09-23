<template>
  <header class="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center">
        <NuxtLink to="/" class="text-xl font-bold mr-4 text-primary hover:text-blue-600">
          Logo
        </NuxtLink>
        <input type="search" placeholder="Search deals..." class="bg-background rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
      </div>
      <div class="flex items-center">
        <ClientOnly>
          <template v-if="!isAuthenticated">
            <button @click="openAuthModal('login')" class="btn btn-secondary mr-4">Log In</button>
            <button @click="openAuthModal('signup')" class="btn btn-primary">Sign Up</button>
          </template>
          <template v-else>
            <button @click="openPostDealModal" class="btn btn-secondary mr-4">Post a Deal</button>
            <NuxtLink to="/profile" class="text-text hover:text-primary mr-4">
              <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="w-8 h-8 rounded-full object-cover">
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </NuxtLink>
            <button class="text-text hover:text-primary mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button @click="handleLogout" class="btn btn-accent">Logout</button>
          </template>
        </ClientOnly>
      </div>
    </div>
    <ClientOnly>
      <AuthModal v-if="showAuthModal" :is-login="isLoginMode" @close="closeAuthModal" @login="handleLogin" @signup="handleSignup" />
      <PostDealModal v-if="showPostDealModal" @close="closePostDealModal" @post-deal="handlePostDeal" />
    </ClientOnly>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isAuthenticated, user } = storeToRefs(authStore)

const showAuthModal = ref(false)
const showPostDealModal = ref(false)
const isLoginMode = ref(true)

const handleLogout = () => {
  authStore.logout()
  // Additional logout logic...
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

const handleLogin = async () => {
  try {
    closeAuthModal()
  } catch (error) {
    console.error('Login error:', error)
    // Handle login error (e.g., show error message)
  }
}

const handleSignup = async () => {
  try {
    closeAuthModal()
  } catch (error) {
    console.error('Signup error:', error)
    // Handle signup error (e.g., show error message)
  }
}

const handlePostDeal = (deal) => {
  console.log('Posted deal:', deal)
  closePostDealModal()
  // Optionally, you can refresh the deals list or add the new deal to the existing list
}

const profilePictureUrl = computed(() => {
  if (user.value?.profilePicture) {
    return user.value.profilePicture.startsWith('http')
      ? user.value.profilePicture
      : `http://localhost:5000${user.value.profilePicture}`
  }
  return null
})
</script>
<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-xl font-bold mr-4">Logo</span>
        <input type="search" placeholder="Search deals..." class="bg-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex items-center">
        <template v-if="!isLoggedIn">
          <button @click="openAuthModal('login')" class="text-gray-600 hover:text-gray-800 mr-4">Log In</button>
          <button @click="openAuthModal('signup')" class="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600">Sign Up</button>
        </template>
        <template v-else>
          <button class="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 mr-4">Post a Deal</button>
          <button @click="openProfile" class="text-gray-600 hover:text-gray-800 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          Toggle Login
        </button>
      </div>
    </div>
    <ProfilePage v-if="showProfile" @close="closeProfile" />
    <AuthModal v-if="showAuthModal" :is-login="isLoginMode" @close="closeAuthModal" @login="handleLogin" @signup="handleSignup" />
  </header>
</template>

<script setup>
import { ref } from 'vue'
import ProfilePage from './ProfilePage.vue'
import AuthModal from './AuthModal.vue'

const isLoggedIn = ref(false)
const showProfile = ref(false)
const showAuthModal = ref(false)
const isLoginMode = ref(true)

const toggleLogin = () => {
  isLoggedIn.value = !isLoggedIn.value
}

const openProfile = () => {
  showProfile.value = true
}

const closeProfile = () => {
  showProfile.value = false
}

const openAuthModal = (mode) => {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const handleLogin = (credentials) => {
  console.log('Login:', credentials)
  // Implement login logic here
  isLoggedIn.value = true
  closeAuthModal()
}

const handleSignup = (userData) => {
  console.log('Signup:', userData)
  // Implement signup logic here
  isLoggedIn.value = true
  closeAuthModal()
}

defineExpose({ isLoggedIn, showProfile, openProfile, closeProfile })
</script>
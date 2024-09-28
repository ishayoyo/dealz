<template>
  <header class="fixed top-0 left-0 right-0 bg-white bg-opacity-90 shadow-sm z-40 transition-all duration-300" :class="{ 'shadow-md': scrolled }">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center">
        <NuxtLink to="/" class="text-xl font-bold mr-4 text-primary hover:text-blue-600 transition duration-300">
          Logo
        </NuxtLink>
        <form @submit.prevent="handleSearch" class="relative hidden md:block">
          <input 
            type="search" 
            v-model="searchQuery"
            placeholder="Search deals..." 
            class="bg-background rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary transition duration-300"
          >
          <button type="submit" class="absolute right-2 top-1/2 transform -translate-y-1/2">
            <i class="fas fa-search text-gray-400"></i>
          </button>
        </form>
      </div>
      <div class="flex items-center">
        <ClientOnly>
          <template v-if="!isAuthenticated">
            <button @click="openAuthModal('login')" class="btn btn-secondary mr-4">Log In</button>
            <button @click="openAuthModal('signup')" class="btn btn-primary">Sign Up</button>
          </template>
          <template v-else>
            <button @click="openPostDealModal" class="btn btn-secondary mr-4">Post a Deal</button>
            <NuxtLink to="/profile" class="text-text hover:text-primary mr-4 transition duration-300">
              <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="w-8 h-8 rounded-full object-cover">
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </NuxtLink>
            <div class="relative">
              <button @click="toggleNotifications" class="text-text hover:text-primary mr-4 transition duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {{ unreadCount }}
                </span>
              </button>
              <NotificationList v-if="showNotifications" @close="closeNotifications" />
            </div>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useDealsStore } from '~/stores/deals' // {{ edit_1 }}
import { storeToRefs } from 'pinia'
import NotificationList from '~/components/NotificationList.vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const dealsStore = useDealsStore() // {{ edit_2 }}
const { isAuthenticated, user } = storeToRefs(authStore)
const { unreadCount } = storeToRefs(notificationStore)
const toast = useToast()
const router = useRouter()
const searchQuery = ref('')

const showAuthModal = ref(false)
const showPostDealModal = ref(false)
const isLoginMode = ref(true)
const scrolled = ref(false)
const showNotifications = ref(false)
const mobileMenuOpen = ref(false) // {{ edit_3 }}

const handleScroll = () => {
  scrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  if (isAuthenticated.value) {
    notificationStore.fetchNotifications()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleLogout = () => {
  authStore.logout()
  notificationStore.clearNotifications()
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

const handlePostDeal = async (dealData) => { // {{ edit_4 }}
  try {
    await dealsStore.postDeal(dealData)
    closePostDealModal()
    toast.success('Deal posted successfully!')
  } catch (error) {
    console.error('Error posting deal:', error)
    toast.error('Failed to post deal. Please try again.')
  }
}

const handleLogin = async (credentials) => {
  try {
    const success = await authStore.login(credentials.email, credentials.password)
    if (success) {
      await notificationStore.fetchNotifications()
      closeAuthModal()
      toast.success('Successfully logged in!')
    } else {
      toast.error('Login failed. Please check your credentials and try again.')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during login')
  }
}

const handleSignup = async (userData) => {
  try {
    const success = await authStore.signup(userData)
    if (success) {
      await notificationStore.fetchNotifications()
      closeAuthModal()
      toast.success('Successfully signed up!')
    } else {
      toast.error('Signup failed. Please check your information and try again.')
    }
  } catch (error) {
    console.error('Signup error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during signup')
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value && isAuthenticated.value) {
    notificationStore.fetchNotifications()
  }
}

const closeNotifications = () => {
  showNotifications.value = false
}

const profilePictureUrl = computed(() => {
  if (user.value?.profilePicture) {
    return user.value.profilePicture.startsWith('http')
      ? user.value.profilePicture
      : `http://localhost:5000${user.value.profilePicture}`
  }
  return null
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } })
  }
}

const toggleMobileMenu = () => { // {{ edit_5 }}
  mobileMenuOpen.value = !mobileMenuOpen.value
}

watch(() => isAuthenticated.value, (newValue) => {
  if (newValue) {
    notificationStore.fetchNotifications()
  } else {
    notificationStore.clearNotifications()
  }
})
</script>
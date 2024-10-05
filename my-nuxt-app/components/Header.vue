<template>
  <header class="fixed top-0 left-0 right-0 bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg shadow-md z-40 transition-all duration-300" :class="{ 'shadow-lg': scrolled }">
    <div class="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
      <div class="flex items-center">
        <NuxtLink to="/" class="flex items-center">
          <img 
            src="/images/logo.png"
            alt="Dealz Logo" 
            class="h-8 md:h-10 w-auto animate-float"
          />
        </NuxtLink>
        <form @submit.prevent="handleSearch" class="relative hidden md:block ml-4">
          <input 
            type="search" 
            v-model="searchQuery"
            placeholder="Search deals..." 
            class="input-field pr-10 h-10 md:h-12 w-64 md:w-80"
          >
          <button type="submit" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-500 hover:text-primary-600 transition-colors duration-300">
            <i class="fas fa-search"></i>
          </button>
        </form>
      </div>
      <div class="flex items-center space-x-4">
        <ClientOnly>
          <template v-if="!isAuthenticated">
            <button @click="$emit('open-auth-modal', 'login')" class="btn btn-secondary md:text-lg md:px-6">Log In</button>
            <button @click="$emit('open-auth-modal', 'signup')" class="btn btn-primary md:text-lg md:px-6">Sign Up</button>
          </template>
          <template v-else>
            <button @click="$emit('open-post-deal-modal')" class="btn btn-secondary hidden md:block md:text-lg md:px-6">Post a Deal</button>
            
            <NuxtLink to="/profile" class="relative group">
              <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="w-10 h-10 rounded-full object-cover border-2 border-primary-300 group-hover:border-primary-500 transition-colors duration-300">
              <div v-else class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 group-hover:bg-primary-200 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </NuxtLink>
            <NuxtLink 
              v-if="user && user.role === 'admin'" 
              to="/admin/dashboard" 
              class="text-text hover:text-primary mr-2 sm:mr-4 transition duration-300"
            >
              Admin Dashboard
            </NuxtLink>
            <div class="relative">
              <button @click="handleNotificationClick" class="text-text hover:text-primary mr-2 sm:mr-4 transition duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {{ unreadCount }}
                </span>
              </button>
              <NotificationList v-if="showNotifications && !isMobile" @close="closeNotifications" />
            </div>
            <button @click="handleLogout" class="btn btn-accent md:text-lg md:px-6">Logout</button>
          </template>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import NotificationList from '~/components/NotificationList.vue'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const dealsStore = useDealsStore()
const { user, isAuthenticated } = storeToRefs(authStore)
const { unreadCount } = storeToRefs(notificationStore)
const toast = useToastification()
const router = useRouter()
const searchQuery = ref('')

const showNotifications = ref(false)
const mobileMenuOpen = ref(false)
const isMobile = ref(false)
const scrolled = ref(false)

const emit = defineEmits(['open-auth-modal', 'open-post-deal-modal'])

const handleScroll = () => {
  scrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Logged out successfully')
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('Failed to logout. Please try again.')
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } })
    searchQuery.value = ''
  }
}

const handleNotificationClick = () => {
  if (isMobile.value) {
    router.push('/notifications')
  } else {
    toggleNotifications()
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

// Watch for changes in authentication status
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    notificationStore.fetchNotifications()
  }
})
</script>

<style scoped>
header {
  height: 64px; /* For mobile */
}

@media (min-width: 768px) {
  header {
    height: 80px; /* For larger screens */
  }
}

/* You can add these styles if you want to adjust the button height as well */
@media (min-width: 768px) {
  .btn {
    @apply py-2.5;
  }
}
</style>
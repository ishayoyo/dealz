<template>
  <div>
    <ClientOnly>
      <AnnouncementBanner 
        v-if="!isAuthenticated" 
        @open-auth-modal="$emit('open-auth-modal', 'signup')" 
      />
      
      <header 
        class="fixed left-0 right-0 bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg shadow-md z-40 transition-all duration-300" 
        :class="[
          {'top-0': isAuthenticated, 'top-10': !isAuthenticated},
          {'shadow-lg transform -translate-y-1': scrolled, 'shadow-sm': !scrolled}
        ]"
      >
        <div class="container mx-auto px-4 flex items-center justify-between h-20 md:h-24">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center relative group">
              <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-1"></div>
              <img 
                src="/images/logo.png"
                alt="Dealz Logo" 
                class="h-16 w-16 md:h-20 md:w-20 object-contain relative z-10 logo-pulse"
              />
            </NuxtLink>
            <form @submit.prevent="handleSearch" class="relative hidden md:block ml-4">
              <input 
                type="search" 
                v-model="searchQuery"
                placeholder="Search deals..." 
                class="input-field pr-10 h-10 md:h-12 w-64 md:w-80 transition-all duration-300 focus:w-96"
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
                  <UserAvatar 
                    :name="user?.username || ''"
                    :size="40"
                    :seed="user?.avatarSeed"
                    :userId="user?._id"
                    :key="`header-avatar-${user?._id}-${user?.avatarSeed}`"
                    class="border-2 border-primary-300 group-hover:border-primary-500 transition-all duration-300 transform group-hover:scale-110"
                  />
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
                    <span v-if="unreadCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
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
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import NotificationList from '~/components/NotificationList.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'
import AnnouncementBanner from '~/components/AnnouncementBanner.vue'
import { useAvatars } from '~/composables/useAvatars'

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

// Add this method to check if the screen is mobile
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 768; // Adjust the breakpoint as needed
}

// Call checkIfMobile on window resize
onMounted(() => {
  window.addEventListener('resize', checkIfMobile);
  checkIfMobile(); // Initial check
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // Initialize avatar for current user if authenticated
  if (user.value?._id) {
    getAvatar(user.value._id, user.value?.avatarSeed)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIfMobile);
  window.removeEventListener('scroll', handleScroll);
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

// Update handleNotificationClick
const handleNotificationClick = () => {
  if (isMobile.value) {
    // Directly navigate to the notifications page
    router.push('/notifications')
  } else {
    toggleNotifications() // Open the notification dropdown on larger screens
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

// Watch for changes in authentication status
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    notificationStore.fetchNotifications()
  }
})

// Update the animation duration for the logo
const logoAnimationDuration = '4s'

// Add this single watcher for notifications
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    notificationStore.fetchNotifications()
  }
})

// Initialize avatar system
const { getAvatar } = useAvatars()

// Watch for user changes to update avatar
watch(() => user.value?._id, (newUserId) => {
  if (newUserId) {
    // Ensure avatar is cached for the current user
    getAvatar(newUserId, user.value?.avatarSeed)
  }
})
</script>

<style scoped>
header {
  height: 80px; /* Reduced for mobile */
}

@media (min-width: 768px) {
  header {
    height: 96px; /* Reduced for larger screens */
  }
}

.btn {
  @apply font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95;
}

.btn-primary {
  @apply bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500;
}

.btn-secondary {
  @apply bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500;
}

.btn-accent {
  @apply bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 focus:ring-pink-500;
}

.input-field {
  @apply w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-300 bg-white bg-opacity-80 hover:bg-opacity-100;
}

/* Make these more specific */
header.top-0 {
  top: 0 !important;
}

header.top-10 {
  top: 40px !important;
}

/* Add this new style for the logo container */
.logo-container {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
}

/* Add this new style for the logo shine effect */
.logo-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  transform: rotate(45deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.logo-pulse {
  animation: subtle-pulse 3s ease-in-out infinite;
}

@keyframes subtle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>

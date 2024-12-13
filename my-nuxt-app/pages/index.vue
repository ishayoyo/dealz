<template>
  <div>
    <AnnouncementBanner @open-auth-modal="openAuthModal" />
    <div class="container mx-auto px-4" 
      :class="{
        'pt-20 md:pt-16': !isAuthenticated,
        'pt-8': isAuthenticated
      }"
    >
      <!-- Hero section for non-authenticated users -->
      <div v-if="!isAuthenticated" class="hidden sm:block text-center mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
          Discover the Best Deals Daily
        </h1>
        <p class="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6">
          Join our community of savvy shoppers and never miss out on amazing discounts.
        </p>
        <div class="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-2 sm:gap-4">
          <button 
            @click="openAuthModal('signup')" 
            class="btn btn-primary text-sm sm:text-base px-2 sm:px-4"
          >
            Start Saving
          </button>
          <button 
            @click="scrollToDeals" 
            class="btn btn-secondary text-sm sm:text-base px-2 sm:px-4"
          >
            Browse Deals
          </button>
        </div>
        <!-- Stats section -->
        <div class="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
          <div class="stats-card group hover:scale-105 transition-all duration-300">
            <div class="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform duration-300"></div>
              <div class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{{ dealStats.total }}+</div>
              <div class="text-sm text-gray-600 font-medium">Active Deals</div>
              <div class="absolute bottom-0 right-0 w-16 h-16 -m-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20"></div>
            </div>
          </div>
          
          <div class="stats-card group hover:scale-105 transition-all duration-300">
            <div class="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform duration-300"></div>
              <div class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{{ dealStats.savings }}%</div>
              <div class="text-sm text-gray-600 font-medium">Avg. Savings</div>
              <div class="absolute bottom-0 right-0 w-16 h-16 -m-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20"></div>
            </div>
          </div>
          
          <div class="stats-card group hover:scale-105 transition-all duration-300">
            <div class="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transform origin-left group-hover:scale-x-100 scale-x-0 transition-transform duration-300"></div>
              <div class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{{ dealStats.users }}k+</div>
              <div class="text-sm text-gray-600 font-medium">Happy Users</div>
              <div class="absolute bottom-0 right-0 w-16 h-16 -m-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories section -->
      <Categories 
        :is-authenticated="isAuthenticated" 
        @update:selectedCategories="selectedCategories = $event" 
      />

      <div v-if="showSkeleton" class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <DealCardSkeleton v-for="i in 8" :key="i" />
        </div>
      </div>
      <div v-else-if="dealsStore.loading && dealsStore.deals.length === 0" class="text-center py-8">Loading deals...</div>
      <div v-else-if="dealsStore.error" class="text-center py-8 text-red-500">{{ dealsStore.error }}</div>
      <div v-else class="container mx-auto px-4 py-8">
        <div 
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <DealCard 
            v-for="deal in dealsStore.deals" 
            :key="`${deal._id}-${avatarVersion}`"
            :deal="deal" 
            @open-modal="openModal" 
          />
        </div>
        
        <!-- Loading indicator -->
        <div 
          v-if="dealsStore.loading" 
          class="flex justify-center py-4"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        
        <!-- Intersection observer target -->
        <div
          v-if="dealsStore.hasMore && !dealsStore.loading"
          ref="loadMoreTrigger"
          class="h-10"
        />
      </div>
    </div>
    <DealModal 
      v-if="selectedDeal" 
      :deal="selectedDeal" 
      @close-modal="closeModal" 
      @open-auth-modal="openAuthModal" 
    />
    <AuthModal 
      v-if="showAuthModal" 
      :show="showAuthModal"
      @close="closeAuthModal" 
      @login="handleLogin" 
      @signup="handleSignup" 
      :is-login="isLoginMode" 
    />
    <FloatingActionButton 
      :isDealModalOpen="isDealModalOpen" 
      @click="handleFabClick"
    />
  </div>
</template>

<script setup>
import { useDealsStore } from '~/stores/deals'
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'
import { onMounted, ref, computed, onUnmounted, watch, nextTick } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'
import { useToastification } from '~/composables/useToastification'
import AuthModal from '~/components/AuthModal.vue'
import DealCardSkeleton from '~/components/DealCardSkeleton.vue'
import Categories from '~/components/Categories.vue'
import FloatingActionButton from '~/components/FloatingActionButton.vue'
import { useRoute } from 'vue-router'
import { useAvatars } from '~/composables/useAvatars'
import { useRuntimeConfig } from '#app'

const dealsStore = useDealsStore()
const authStore = useAuthStore()
const { deals, loading, error } = storeToRefs(dealsStore)
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()

const { $socket } = useNuxtApp()

const { fetchBatchAvatars, clearCache } = useAvatars()

onMounted(async () => {
  try {
    // Fetch deals
    if (dealsStore.deals.length === 0) {
      await dealsStore.fetchDeals()
    }

    if (dealsStore.deals.length === 0) {
      await dealsStore.fetchDeals({ bypassCache: true })
    }

    // Batch fetch avatars for all deals
    const userIds = dealsStore.deals
      .map(deal => deal.user?._id)
      .filter(id => id) // Remove any undefined/null values
    
    await fetchBatchAvatars(userIds)

    // Check authentication status silently
    if (!isAuthenticated.value) {
      await authStore.checkAuth()
    }

    // Set up socket listeners only if authenticated
    if (isAuthenticated.value) {
      $socket.on('newDeal', (data) => {
        console.log('Received new deal:', data)
        dealsStore.handleNewDeal(data.deal)
        toast.success(`New deal added: ${data.deal.title}`)
      })

      $socket.on('updateDeal', (data) => {
        console.log('Received deal update:', data)
        dealsStore.handleNewDeal(data.deal)
        toast.info(`Deal updated: ${data.deal.title}`)
      })
    }

    $socket.on('avatarChanged', ({ userId }) => {
      const { clearCache } = useAvatars()
      clearCache(userId)
      fetchBatchAvatars([userId])
    })
  } catch (error) {
    console.error('Error in onMounted hook:', error)
    toast.error('An error occurred while loading deals. Please try again.')
  }
})

onUnmounted(() => {
  if (isAuthenticated.value) {
    $socket.off('newDeal')
    $socket.off('updateDeal')
  }
  $socket.off('avatarChanged')
})

const selectedDeal = ref(null)
const showAuthModal = ref(false)
const isLoginMode = ref(true)

const openModal = (deal) => {
  selectedDeal.value = dealsStore.getDealById(deal._id)
}

const closeModal = () => {
  selectedDeal.value = null
}

const openAuthModal = (mode) => {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const handleLogin = async (credentials) => {
  try {
    const success = await authStore.login(credentials.email, credentials.password)
    if (success) {
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

// Computed property with a null check
const safeDeals = computed(() => {
  console.log('Computing safeDeals:', dealsStore.getSortedDeals)
  if (authStore.user && authStore.user.role === 'admin') {
    return dealsStore.getSortedDeals
  } else {
    return dealsStore.getSortedDeals.filter(deal => deal.status === 'approved')
  }
})

// Watch for changes in the deals store
watch(() => dealsStore.deals, async (newDeals) => {
  if (newDeals.length > 0) {
    const userIds = newDeals
      .map(deal => deal.user?._id)
      .filter(id => id)
    await fetchBatchAvatars(userIds)
  }
}, { deep: true })

const selectedCategories = ref([])

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category)
  if (index === -1) {
    selectedCategories.value.push(category)
  } else {
    selectedCategories.value.splice(index, 1)
  }
}

// Watch for category changes
watch(selectedCategories, () => {
  console.log('Categories changed, resetting pagination');
  dealsStore.resetPagination();
  dealsStore.fetchDeals();
});

const showSkeleton = computed(() => dealsStore.loading && dealsStore.deals.length === 0)

const scrollToDeals = () => {
  window.scrollTo({
    top: window.innerHeight * 0.6,
    behavior: 'smooth'
  })
}

const dealStats = ref({
  total: 500,
  savings: 45,
  users: 10
})

const showBanner = ref(true)

const isDealModalOpen = ref(false)

const route = useRoute()

// Update isDealModalOpen based on route changes
watch(() => route.params.id, (newId) => {
  isDealModalOpen.value = !!newId
}, { immediate: true })

const handleFabClick = () => {
  // Handle FAB click action
}

const avatarVersion = ref(0)

$socket.on('avatarChanged', ({ userId }) => {
  const { clearCache } = useAvatars()
  clearCache(userId)
  fetchBatchAvatars([userId])
})

const loadMoreTrigger = ref(null)
let observer = null

// Remove debounce since we don't have useDebounceFn
let loadingTimeout = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    async (entries) => {
      const entry = entries[0]
      console.log('Intersection observer triggered:', {
        isIntersecting: entry.isIntersecting,
        loading: dealsStore.loading,
        hasMore: dealsStore.hasMore,
        currentDeals: dealsStore.deals.length,
        totalDeals: dealsStore.totalDeals
      })

      if (entry.isIntersecting && !dealsStore.loading && dealsStore.hasMore) {
        // Clear any existing timeout
        if (loadingTimeout) {
          clearTimeout(loadingTimeout)
        }
        
        // Set a new timeout for loading
        loadingTimeout = setTimeout(async () => {
          await dealsStore.fetchDeals()
        }, 300)
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
    console.log('Observer attached to trigger element')
  }
}

onMounted(() => {
  // Initial load
  if (dealsStore.deals.length === 0) {
    dealsStore.resetPagination()
    dealsStore.fetchDeals()
  }

  // Setup observer after initial render
  nextTick(() => {
    setupObserver()
  })
})

// Reattach observer when loadMoreTrigger changes
watch(loadMoreTrigger, (newVal) => {
  if (newVal && dealsStore.hasMore) {
    nextTick(() => {
      setupObserver()
    })
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
  }
})

// Reset pagination when filters change
watch(selectedCategories, () => {
  dealsStore.resetPagination()
  dealsStore.fetchDeals()
})

const config = useRuntimeConfig()
const isDev = process.dev // This will be true in development, false in production
</script>

<template>
  <div>
    <AnnouncementBanner @open-auth-modal="openAuthModal" />
    <div class="container mx-auto px-4" 
      :class="{
        'pt-20 md:pt-16': !isAuthenticated,  // More padding for non-auth to account for header
        'pt-8': isAuthenticated              // Regular padding when authenticated
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
        <div class="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8 max-w-2xl mx-auto">
          <div class="p-2 sm:p-4 rounded-lg bg-white shadow-md">
            <div class="text-xl sm:text-2xl font-bold text-primary-600">{{ dealStats.total }}+</div>
            <div class="text-xs sm:text-sm text-gray-600">Active Deals</div>
          </div>
          <div class="p-2 sm:p-4 rounded-lg bg-white shadow-md">
            <div class="text-xl sm:text-2xl font-bold text-primary-600">{{ dealStats.savings }}%</div>
            <div class="text-xs sm:text-sm text-gray-600">Avg. Savings</div>
          </div>
          <div class="p-2 sm:p-4 rounded-lg bg-white shadow-md">
            <div class="text-xl sm:text-2xl font-bold text-primary-600">{{ dealStats.users }}k+</div>
            <div class="text-xs sm:text-sm text-gray-600">Happy Users</div>
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
      <div v-else-if="dealsStore.loading" class="text-center py-8">Loading deals...</div>
      <div v-else-if="dealsStore.error" class="text-center py-8 text-red-500">{{ dealsStore.error }}</div>
      <div v-else class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <DealCard 
            v-for="deal in filteredDeals" 
            :key="deal._id" 
            :deal="deal" 
            @open-modal="openModal" 
          />
        </div>
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
  </div>
</template>

<script setup>
import { useDealsStore } from '~/stores/deals'
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'
import { onMounted, ref, computed, onUnmounted, watch } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'
import { useToastification } from '~/composables/useToastification'
import AuthModal from '~/components/AuthModal.vue'
import DealCardSkeleton from '~/components/DealCardSkeleton.vue'
import Categories from '~/components/Categories.vue'

const dealsStore = useDealsStore()
const authStore = useAuthStore()
const { deals, loading, error } = storeToRefs(dealsStore)
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()

const { $socket } = useNuxtApp()

onMounted(async () => {
  try {
    // Fetch deals regardless of authentication status
    if (dealsStore.deals.length === 0) {
      await dealsStore.fetchDeals()
    }

    // If deals are empty (potential cache miss), fetch again
    if (dealsStore.deals.length === 0) {
      await dealsStore.fetchDeals({ bypassCache: true })
    }

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
watch(() => dealsStore.deals, (newDeals) => {
  console.log('Deals updated:', newDeals)
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

const filteredDeals = computed(() => {
  if (selectedCategories.value.length === 0) {
    return safeDeals.value
  }
  return safeDeals.value.filter(deal => selectedCategories.value.includes(deal.category))
})

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
</script>

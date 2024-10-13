<template>
  <div>
    <div class="container mx-auto px-4 py-8">
      <!-- Add category filter chips -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="category in categories"
          :key="category"
          @click="toggleCategory(category)"
          class="btn btn-sm"
          :class="selectedCategories.includes(category) ? 'btn-primary' : 'btn-secondary'"
        >
          {{ category }}
        </button>
      </div>

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

const categories = ref([
  "Electronics",
  "Home",
  "Fashion",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Travel",
  "Food",
  "Auto",
  "DIY",
  "Pets",
  "Other"
])

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
</script>

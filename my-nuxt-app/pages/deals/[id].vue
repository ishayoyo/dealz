<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <DealModal 
      v-if="deal" 
      :deal="deal" 
      :isOpen="true"
      :isAuthenticated="isAuthenticated"
      @close-modal="goBack"
      @update-follow-status="updateFollowStatus"
      @follow-deal="handleFollowDeal"
      @open-auth-modal="openAuthModal"
    />
    <div v-else-if="loading" class="text-center py-8">Loading deal...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { useToastification } from '~/composables/useToastification'
import api from '~/services/api'
import DealModal from '~/components/DealModal.vue'
import AuthModal from '~/components/AuthModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dealsStore = useDealsStore()
const toast = useToastification()

const deal = ref(null)
const loading = ref(true)
const error = ref(null)
const showAuthModal = ref(false)
const isLoginMode = ref(true)

const isAuthenticated = computed(() => authStore.isAuthenticated)

async function fetchDeal() {
  loading.value = true
  error.value = null
  try {
    // First, try to get the deal from the store
    const storeData = dealsStore.getDealById(route.params.id)
    
    if (storeData) {
      deal.value = storeData
    } else {
      // If not in store, fetch from API
      const response = await api.get(`/deals/${route.params.id}`)
      deal.value = response.data.data.deal
    }
    
    // Set follow status if user is authenticated
    if (isAuthenticated.value) {
      if (deal.value.user) {
        deal.value.isFollowingUser = authStore.user.following.includes(deal.value.user._id)
      }
      try {
        const statusResponse = await api.get(`/deals/${route.params.id}/status`)
        deal.value.isFollowing = statusResponse.data.data.isFollowing
      } catch (statusError) {
        console.error('Error fetching deal status:', statusError)
        // Don't set error.value here, as this is not critical for viewing the deal
      }
    } else {
      deal.value.isFollowingUser = false
      deal.value.isFollowing = false
    }
  } catch (err) {
    console.error('Error fetching deal:', err)
    error.value = 'Failed to load deal'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 2) {
    router.go(-1)
  } else {
    // No previous page in history, redirect to home or deals list
    router.push('/')  // or router.push('/deals') if you have a deals listing page
  }
}

function updateFollowStatus(isFollowing) {
  if (deal.value && deal.value.user) {
    deal.value.isFollowingUser = isFollowing
  }
}

const handleFollowDeal = async (followData) => {
  deal.value.isFollowing = followData.isFollowing
  deal.value.followCount = followData.followCount
  dealsStore.updateDealFollowStatus(followData.dealId, followData.isFollowing, followData.followCount)
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
      // Optionally, refresh the deal data to update authenticated-only information
      await fetchDeal()
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
      // Optionally, refresh the deal data to update authenticated-only information
      await fetchDeal()
    } else {
      toast.error('Signup failed. Please check your information and try again.')
    }
  } catch (error) {
    console.error('Signup error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during signup')
  }
}

onMounted(async () => {
  await fetchDeal()
})
</script>
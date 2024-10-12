<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <div v-if="loading" class="text-center py-8">Loading deal...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <DealModal 
      v-else-if="deal" 
      :deal="deal" 
      :isOpen="true"
      :isAuthenticated="isAuthenticated"
      @close-modal="goBack"
      @update-follow-status="updateFollowStatus"
      @follow-deal="handleFollowDeal"
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { useToastification } from '~/composables/useToastification'
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
    const response = await dealsStore.fetchDealById(route.params.id)
    deal.value = response.data.deal
    if (isAuthenticated.value) {
      deal.value.isFollowing = response.data.isFollowing
      deal.value.isFollowingUser = authStore.user.following.includes(deal.value.user._id)
    }
  } catch (err) {
    console.error('Error fetching deal:', err)
    error.value = 'Failed to load deal'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDeal()
})

function goBack() {
  router.go(-1)
}

function updateFollowStatus(isFollowing) {
  if (deal.value && deal.value.user) {
    deal.value.isFollowingUser = isFollowing
  }
}

function handleFollowDeal(followData) {
  deal.value.isFollowing = followData.isFollowing
  deal.value.followCount = followData.followCount
  dealsStore.updateDealFollowStatus(followData.dealId, followData.isFollowing, followData.followCount)
}

function openAuthModal(mode) {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

function closeAuthModal() {
  showAuthModal.value = false
}

async function handleLogin(credentials) {
  try {
    const success = await authStore.login(credentials.email, credentials.password)
    if (success) {
      closeAuthModal()
      toast.success('Successfully logged in!')
      await fetchDeal() // Refetch deal to get authenticated data
    } else {
      toast.error('Login failed. Please check your credentials and try again.')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during login')
  }
}

async function handleSignup(userData) {
  try {
    const success = await authStore.signup(userData)
    if (success) {
      closeAuthModal()
      toast.success('Successfully signed up!')
      await fetchDeal() // Refetch deal to get authenticated data
    } else {
      toast.error('Signup failed. Please check your information and try again.')
    }
  } catch (error) {
    console.error('Signup error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during signup')
  }
}
</script>
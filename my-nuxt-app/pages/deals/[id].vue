<template>
  <div class="relative">
    <!-- Add a class to hide the header when modal is open on mobile -->
    <div 
      class="container mx-auto px-4 py-8"
      :class="{ 'pt-24': !deal || !isMobile }"
    >
      <Transition name="fade" mode="out-in">
        <DealModalSkeleton v-if="loading" key="loading" />
        <div v-else-if="error" class="text-center py-8 text-red-500" key="error">{{ error }}</div>
        <DealModal 
          v-else-if="deal" 
          v-model:deal="deal"
          :isOpen="true"
          :isAuthenticated="isAuthenticated"
          :isAdmin="isAdmin"
          :isDedicatedPage="true"
          @close-modal="goBack"
          @update-follow-status="updateFollowStatus"
          @follow-deal="handleFollowDeal"
          @open-auth-modal="openAuthModal"
          @delete-comment="handleDeleteComment"
          key="deal-modal"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { useToastification } from '~/composables/useToastification'
import DealModal from '~/components/DealModal.vue'
import DealModalSkeleton from '~/components/DealModalSkeleton.vue'
import AuthModal from '~/components/AuthModal.vue'
import api from '~/services/api'
import { useHead } from '#imports'
import { useWindowSize } from '@vueuse/core'

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
const isAdmin = computed(() => authStore.user && authStore.user.role === 'admin')

// Add this computed property for the base URL
const baseUrl = computed(() => {
  return process.client 
    ? window.location.origin 
    : 'http://localhost:3000' // Default for SSR
})

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
    console.log('Fetched deal:', deal.value)
    if (deal.value.comments) {
      console.log('Deal comments:', deal.value.comments)
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

const goBack = () => {
  // Check if we can go back
  if (window.history.length > 2) { // > 2 because the current page counts as 1
    router.go(-1)
  } else {
    // No history, go to home page
    router.push('/')
  }
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

async function handleDeleteComment(commentId) {
  if (!commentId) {
    console.error('Attempted to delete comment with undefined ID')
    toast.error('Error: Comment ID is missing')
    return
  }

  try {
    await api.delete(`/comments/${commentId}`)
    // The comment has already been removed from the deal object in the DealModal component
    toast.success('Comment deleted successfully')
  } catch (err) {
    console.error('Error deleting comment:', err)
    if (err.response && err.response.status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (err.response && err.response.status === 404) {
      toast.error('Comment not found. It may have been already deleted.')
    } else {
      toast.error('Failed to delete comment. Please try again.')
    }
    // If the API call fails, we need to add the comment back to the deal object
    const deletedComment = deal.value.comments.find(comment => comment.id === commentId)
    if (deletedComment) {
      deal.value.comments.push(deletedComment)
    }
  }
}

// Add this watch to update meta tags when deal data changes
watch(() => deal.value, (newDeal) => {
  if (newDeal) {
    // Create a friendly sharing message
    const sharingDescription = `I found this great deal at SaverSonic! ${newDeal.title} for only $${newDeal.price} (Was $${newDeal.listPrice})`

    useHead({
      title: newDeal.title,
      meta: [
        { name: 'description', content: sharingDescription },
        // OpenGraph Basic
        { property: 'og:title', content: newDeal.title },
        { property: 'og:description', content: sharingDescription },
        { property: 'og:image', content: getFullImageUrl(newDeal.imageUrl) },
        { property: 'og:url', content: `${baseUrl.value}/deals/${newDeal._id}` },
        { property: 'og:type', content: 'product' },
        // OpenGraph Product Specific
        { property: 'og:price:amount', content: newDeal.price.toString() },
        { property: 'og:price:currency', content: 'USD' },
        // Add original price and discount if available
        { property: 'product:original_price:amount', content: newDeal.listPrice?.toString() },
        { property: 'product:original_price:currency', content: 'USD' },
        { property: 'product:sale_price:amount', content: newDeal.price.toString() },
        { property: 'product:sale_price:currency', content: 'USD' },
        // Add availability
        { property: 'product:availability', content: 'in stock' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: newDeal.title },
        { name: 'twitter:description', content: sharingDescription },
        { name: 'twitter:image', content: getFullImageUrl(newDeal.imageUrl) },
      ],
    })
  }
}, { immediate: true })

// Add this helper function to ensure full image URLs
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase.includes('localhost')
    ? 'http://localhost:5000'
    : 'https://saversonic.com'
    
  return `${baseUrl}${imageUrl}`
}

// Add keyboard support
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    goBack()
  }
}

const { width } = useWindowSize()

// Add this computed property
const isMobile = computed(() => width.value < 768)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

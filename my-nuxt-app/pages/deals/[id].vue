<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <Transition name="fade" mode="out-in">
      <DealModalSkeleton v-if="loading" key="loading" />
      <div v-else-if="error" class="text-center py-8 text-red-500" key="error">{{ error }}</div>
      <DealModal 
        v-else-if="deal" 
        v-model:deal="deal"
        :isOpen="true"
        :isAuthenticated="isAuthenticated"
        :isAdmin="isAdmin"
        @close-modal="goBack"
        @update-follow-status="updateFollowStatus"
        @follow-deal="handleFollowDeal"
        @open-auth-modal="openAuthModal"
        @delete-comment="handleDeleteComment"
        key="deal-modal"
      />
    </Transition>
    <Transition name="fade">
      <AuthModal 
        v-if="showAuthModal" 
        :show="showAuthModal"
        @close="closeAuthModal" 
        @login="handleLogin" 
        @signup="handleSignup" 
        :is-login="isLoginMode" 
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { useToastification } from '~/composables/useToastification'
import DealModal from '~/components/DealModal.vue'
import DealModalSkeleton from '~/components/DealModalSkeleton.vue'
import AuthModal from '~/components/AuthModal.vue'
import api from '~/services/api'

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

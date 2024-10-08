<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <DealModal 
      v-if="deal" 
      :deal="deal" 
      :isOpen="true"
      @close-modal="goBack"
      @update-follow-status="updateFollowStatus"
      @follow-deal="handleFollowDeal"
    />
    <div v-else-if="loading" class="text-center py-8">Loading deal...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import api from '~/services/api'
import DealModal from '~/components/DealModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dealsStore = useDealsStore()

const deal = ref(null)
const loading = ref(true)
const error = ref(null)

// Remove the isFollowing computed property, as it's now handled in DealModal

onMounted(async () => {
  await fetchDeal()
})

async function fetchDeal() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get(`/deals/${route.params.id}`)
    console.log('Deal data:', response.data.data.deal) // Add this line
    deal.value = response.data.data.deal
    if (authStore.isAuthenticated && deal.value.user) {
      deal.value.isFollowingUser = authStore.user.following.includes(deal.value.user._id)
    }
    if (authStore.isAuthenticated) {
      const statusResponse = await api.get(`/deals/${route.params.id}/status`)
      deal.value.isFollowing = statusResponse.data.data.isFollowing
    }
  } catch (err) {
    console.error('Error fetching deal:', err)
    if (err.response && err.response.status === 403) {
      error.value = 'This deal is not available or pending approval.'
    } else {
      error.value = 'Failed to load deal'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
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
</script>
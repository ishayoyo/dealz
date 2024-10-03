<template>
  <div>
    <div v-if="dealsStore.loading" class="text-center py-8">Loading deals...</div>
    <div v-else-if="dealsStore.error" class="text-center py-8 text-red-500">{{ dealsStore.error }}</div>
    <div v-else class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard 
          v-for="deal in safeDeals" 
          :key="deal._id" 
          :deal="deal" 
          @open-modal="openModal" 
        />
      </div>
    </div>
    <DealModal 
      v-if="selectedDeal" 
      :deal="selectedDeal" 
      @close-modal="closeModal" 
      @open-auth-modal="openAuthModal" 
    />
    <AuthModal v-if="showAuthModal" @close="closeAuthModal" />
  </div>
</template>

<script setup>
import { useDealsStore } from '~/stores/deals'
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'
import { onMounted, ref, computed, onUnmounted, watch } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'
import AuthModal from '~/components/AuthModal.vue'
import { useToastification } from '~/composables/useToastification'

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

const openModal = (deal) => {
  selectedDeal.value = dealsStore.getDealById(deal._id)
}

const closeModal = () => {
  selectedDeal.value = null
}

const openAuthModal = () => {
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

// Computed property with a null check
const safeDeals = computed(() => {
  console.log('Computing safeDeals:', dealsStore.getSortedDeals)
  return dealsStore.getSortedDeals
})

// Watch for changes in the deals store
watch(() => dealsStore.deals, (newDeals) => {
  console.log('Deals updated:', newDeals)
}, { deep: true })
</script>
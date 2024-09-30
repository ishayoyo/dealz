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
import { storeToRefs } from 'pinia'
import { onMounted, ref, computed, onUnmounted, watch } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'
import AuthModal from '~/components/AuthModal.vue'
import { useToastification } from '~/composables/useToastification'

const dealsStore = computed(() => useDealsStore())
const { deals, loading, error } = storeToRefs(dealsStore)
const toast = useToastification()

const { $socket } = useNuxtApp()

onMounted(async () => {
  try {
    // Fetch deals only if the store is empty
    if (dealsStore.value.deals.length === 0) {
      await dealsStore.value.fetchDeals()
    }

    $socket.on('newDeal', (data) => {
      console.log('Received new deal:', data)
      dealsStore.value.handleNewDeal(data.deal)
      toast.success(`New deal added: ${data.deal.title}`)
    })

    $socket.on('updateDeal', (data) => {
      console.log('Received deal update:', data)
      dealsStore.value.handleNewDeal(data.deal) // We can use the same method for updates
      toast.info(`Deal updated: ${data.deal.title}`)
    })
  } catch (error) {
    console.error('Error in onMounted hook:', error)
    toast.error('An error occurred while loading deals. Please try again.')
  }
})

onUnmounted(() => {
  $socket.off('newDeal')
  $socket.off('updateDeal')
})

const selectedDeal = ref(null)
const showAuthModal = ref(false)

const openModal = (deal) => {
  selectedDeal.value = dealsStore.value.getDealById(deal._id) // Updated to fetch deal by ID
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

// Computed property to ensure deals are always an array and sorted
const safeDeals = computed(() => {
  console.log('Computing safeDeals:', dealsStore.value.getSortedDeals)
  return dealsStore.value.getSortedDeals
})

// Watch for changes in the deals store
watch(() => dealsStore.value.deals, (newDeals) => {
  console.log('Deals updated:', newDeals)
}, { deep: true })
</script>
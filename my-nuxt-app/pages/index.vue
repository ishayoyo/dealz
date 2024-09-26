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

    <!-- Socket Connection Test Section -->
    <div class="container mx-auto px-4 py-8 mt-8 bg-gray-100 rounded-lg">
      <h2 class="text-2xl font-bold mb-4">Socket Connection Test</h2>
      <p>Connection status: {{ isConnected ? 'Connected' : 'Disconnected' }}</p>
      <button 
        @click="testConnection" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Socket Connection
      </button>
      <p v-if="lastMessage" class="mt-2">Last message: {{ lastMessage }}</p>
      <p v-if="connectionError" class="mt-2 text-red-500">Error: {{ connectionError }}</p>
    </div>
  </div>
</template>

<script setup>
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { onMounted, ref, computed, onUnmounted, watch } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'
import AuthModal from '~/components/AuthModal.vue'
import { useSocket } from '~/composables/useSocket'
import { useToast } from 'vue-toastification'

const dealsStore = computed(() => useDealsStore())
const { deals, loading, error } = storeToRefs(dealsStore)
const toast = useToast()

const { $socket } = useNuxtApp()

onMounted(async () => {
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

// Socket connection test
const { isConnected, lastMessage, connectionError, testConnection } = useSocket()

// Computed property to ensure deals is always an array and sorted
const safeDeals = computed(() => {
  console.log('Computing safeDeals:', dealsStore.value.getSortedDeals) // Added console log for debugging
  return dealsStore.value.getSortedDeals
})

// Watch for changes in the deals store
watch(() => dealsStore.value.deals, (newDeals) => {
  console.log('Deals updated:', newDeals)
}, { deep: true })
</script>
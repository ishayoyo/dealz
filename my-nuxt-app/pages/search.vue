<template>
    <div class="container mx-auto px-4 py-8 pt-24">
      <h1 class="text-2xl font-bold mb-4">Search Results</h1>
      <div v-if="loading" class="text-center py-8">Loading...</div>
      <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
      <div v-else-if="deals.length === 0" class="text-center py-8">No results found</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard 
          v-for="deal in deals" 
          :key="deal._id" 
          :deal="deal" 
          @open-modal="openModal" 
        />
      </div>
      <DealModal 
        v-if="selectedDeal" 
        :deal="selectedDeal" 
        @close-modal="closeModal" 
        @open-auth-modal="openAuthModal" 
      />
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useDealsStore } from '~/stores/deals'
  import DealCard from '~/components/DealCard.vue'
  import DealModal from '~/components/DealModal.vue'
  
  const route = useRoute()
  const dealsStore = useDealsStore()
  
  const deals = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedDeal = ref(null)
  
  const fetchDeals = async () => {
  loading.value = true
  error.value = null
  try {
    const searchQuery = route.query.q
    const response = await dealsStore.searchDeals(searchQuery)
    deals.value = response // Assuming the response is already the array of deals
  } catch (err) {
    console.error('Error fetching deals:', err)
    error.value = err.message || 'An error occurred while fetching deals'
  } finally {
    loading.value = false
  }
}
  
  const openModal = (deal) => {
    selectedDeal.value = deal
  }
  
  const closeModal = () => {
    selectedDeal.value = null
  }
  
  const openAuthModal = () => {
    // Implement this if needed
  }
  
  onMounted(fetchDeals)
  
  watch(() => route.query.q, fetchDeals)
  </script>
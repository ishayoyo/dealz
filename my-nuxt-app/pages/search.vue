<template>
    <div class="container mx-auto px-4 py-8 pt-24">
      <h1 class="text-2xl font-bold mb-4">Search Results</h1>
      <div v-if="dealsStore.loading" class="text-center py-8">Loading...</div>
      <div v-else-if="dealsStore.error" class="text-center py-8 text-red-500">{{ dealsStore.error }}</div>
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
  const selectedDeal = ref(null)
  
  const fetchDeals = async () => {
    try {
      const searchQuery = route.query.q
      const category = route.query.category
      const store = route.query.store
      const minPrice = route.query.minPrice
      const maxPrice = route.query.maxPrice
      const sortBy = route.query.sortBy
      console.log('Searching with query:', searchQuery, 'and options:', { category, store, minPrice, maxPrice, sortBy });
      deals.value = await dealsStore.searchDeals(searchQuery, { category, store, minPrice, maxPrice, sortBy })
      console.log('Deals received:', deals.value.length);
    } catch (err) {
      console.error('Error fetching deals:', err)
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
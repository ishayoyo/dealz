<template>
  <div>
    <div v-if="loading" class="text-center py-8">Loading deals...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <div v-else class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard v-for="deal in deals" :key="deal._id" :deal="deal" @open-modal="openModal" />
      </div>
    </div>
    <DealModal v-if="selectedDeal" :deal="selectedDeal" @close-modal="closeModal" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '~/services/api'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'

const selectedDeal = ref(null)
const deals = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await api.get('/deals')
    console.log('API response:', response.data)
    deals.value = response.data.data.deals
    console.log('Deals loaded:', deals.value)
  } catch (err) {
    console.error('Error fetching deals:', err)
    error.value = 'Failed to load deals. Please try again later.'
  } finally {
    loading.value = false
  }
})

const openModal = (deal) => {
  console.log('Opening modal for deal:', deal)
  selectedDeal.value = deal
}

const closeModal = () => {
  console.log('Closing modal')
  selectedDeal.value = null
}

watch(selectedDeal, (newValue) => {
  console.log('selectedDeal changed:', newValue)
})
</script>
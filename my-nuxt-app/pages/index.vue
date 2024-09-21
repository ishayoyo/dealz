<template>
  <div>
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard v-for="deal in deals" :key="deal.id" :deal="deal" @open-modal="openModal" />
      </div>
    </div>
    <DealModal :deal="selectedDeal" @close-modal="closeModal" v-if="selectedDeal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'

const selectedDeal = ref(null)

const deals = ref([
  // ... (your deals data remains the same) ...
])

const openModal = (deal) => {
  selectedDeal.value = deal
}

const closeModal = () => {
  selectedDeal.value = null
}
</script>
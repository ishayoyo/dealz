<template>
  <div>
    <div v-if="loading" class="text-center py-8">Loading deals...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <div v-else class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard v-for="deal in deals" :key="deal._id" :deal="deal" @open-modal="openModal" />
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
import { onMounted, ref } from 'vue'
import DealModal from '~/components/DealModal.vue'
import AuthModal from '~/components/AuthModal.vue'

const dealsStore = useDealsStore()
const { deals, loading, error } = storeToRefs(dealsStore)

onMounted(async () => {
  if (deals.value.length === 0) {
    await dealsStore.fetchDeals()
  }
})

const selectedDeal = ref(null)
const showAuthModal = ref(false)

const openModal = (deal) => {
  selectedDeal.value = { ...deal }
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
</script>
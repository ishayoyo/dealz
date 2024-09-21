<template>
  <div class="min-h-screen bg-gray-100">
    <Header />
    <main class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <DealCard v-for="deal in deals" :key="deal.id" :deal="deal" @open-modal="openModal" />
      </div>
    </main>
    <DealModal :deal="selectedDeal" @close-modal="closeModal" />
  </div>
</template>

<script>
import Header from '~/components/Header.vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'

export default {
  components: {
    Header,
    DealCard,
    DealModal
  },
  data() {
    return {
      deals: [], // Fetch deals from API
      selectedDeal: null
    }
  },
  methods: {
    openModal(deal) {
      this.selectedDeal = deal
    },
    closeModal() {
      this.selectedDeal = null
    }
  }
}
</script>
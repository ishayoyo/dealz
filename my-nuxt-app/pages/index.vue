<template>
  <div>
    <Header />
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
import Header from '~/components/Header.vue'
import DealCard from '~/components/DealCard.vue'
import DealModal from '~/components/DealModal.vue'

const deals = ref([
  {
    id: 1,
    title: 'Sony WH-1000XM4 Wireless Headphones',
    description: 'Industry-leading noise canceling with Dual Noise Sensor technology',
    price: '$278.00',
    image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
    postedBy: 'AudioPhile',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    upvotes: 342
  },
  // Add more deal objects here...
])

const selectedDeal = ref(null)

const openModal = (deal) => {
  selectedDeal.value = deal
}

const closeModal = () => {
  selectedDeal.value = null
}
</script>
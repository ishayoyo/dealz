<template>
  <NuxtLayout name="default">
    <div>
      <Header />
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <DealCard v-for="deal in deals" :key="deal.id" :deal="deal" @open-modal="openModal" />
        </div>
      </div>
      <DealModal :deal="selectedDeal" @close-modal="closeModal" v-if="selectedDeal" />
    </div>
  </NuxtLayout>
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
  {
    id: 2,
    title: 'Nintendo Switch OLED Model',
    description: 'Vibrant 7-inch OLED screen with enhanced audio',
    price: '$349.99',
    image: 'https://m.media-amazon.com/images/I/71Y1U-gRe4L._SL1500_.jpg',
    postedBy: 'GamerPro',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    upvotes: 287
  },
  {
    id: 3,
    title: 'Apple AirPods Pro (2nd Generation)',
    description: 'Active Noise Cancellation, Transparency mode, Spatial Audio',
    price: '$249.00',
    image: 'https://m.media-amazon.com/images/I/61f1YfTkTDL._AC_SL1500_.jpg',
    postedBy: 'TechEnthusiast',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    upvotes: 412
  },
  {
    id: 4,
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    description: '6 Quart, 14 One-Touch Programs',
    price: '$79.95',
    image: 'https://m.media-amazon.com/images/I/71WtwEvYDOS._AC_SL1500_.jpg',
    postedBy: 'CookingMaster',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    upvotes: 256
  },
  {
    id: 5,
    title: 'Kindle Paperwhite (8 GB)',
    description: 'Now with a 6.8" display and thinner borders',
    price: '$139.99',
    image: 'https://m.media-amazon.com/images/I/61Ww4abGclL._AC_SL1000_.jpg',
    postedBy: 'BookWorm',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    upvotes: 189
  },
  {
    id: 6,
    title: 'Fitbit Charge 5 Advanced Fitness & Health Tracker',
    description: 'Built-in GPS, stress management tools, sleep tracking',
    price: '$129.95',
    image: 'https://m.media-amazon.com/images/I/61YYXv4IQJL._AC_SL1500_.jpg',
    postedBy: 'FitnessFreak',
    userAvatar: 'https://i.pravatar.cc/150?img=6',
    upvotes: 217
  }
])

const selectedDeal = ref(null)

const openModal = (deal) => {
  selectedDeal.value = deal
}

const closeModal = () => {
  selectedDeal.value = null
}
</script>
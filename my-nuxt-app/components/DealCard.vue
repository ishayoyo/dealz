<template>
  <div class="bg-white rounded-md shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" @click="openModal">
    <img :src="imageUrl" :alt="deal.title" class="w-full h-48 object-cover">
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2">{{ deal.title }}</h3>
      <p class="text-gray-600 text-sm mb-2">{{ deal.description }}</p>
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-green-500">{{ deal.price }}</span>
        <div class="flex items-center">
          <button @click.stop="voteDeal(1)" class="text-gray-500 hover:text-green-500 mr-1">
            <i class="fas fa-arrow-up"></i>
          </button>
          <span class="text-sm text-gray-500">{{ deal.voteCount }}</span>
          <button @click.stop="voteDeal(-1)" class="text-gray-500 hover:text-red-500 ml-1">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
      </div>
      <div class="flex items-center">
        <img v-if="deal.user && deal.user.profilePicture" :src="deal.user.profilePicture" :alt="deal.user.username" class="w-6 h-6 rounded-full mr-2">
        <span class="text-sm text-gray-500">{{ deal.user ? deal.user.username : 'Unknown User' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import api from '~/services/api'

const props = defineProps(['deal'])
const emit = defineEmits(['open-modal'])

const imageUrl = computed(() => {
  return props.deal.imageUrl ? `http://localhost:5000${props.deal.imageUrl}` : ''
})

const voteDeal = async (value) => {
  try {
    const response = await api.post(`/deals/${props.deal._id}/vote`, { value })
    props.deal.voteCount = response.data.data.voteCount
  } catch (error) {
    console.error('Error voting deal:', error)
  }
}

const openModal = () => {
  console.log('DealCard: Emitting open-modal event for deal:', props.deal)
  emit('open-modal', props.deal)
}
</script>
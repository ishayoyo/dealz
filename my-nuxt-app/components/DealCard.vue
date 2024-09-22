<template>
  <div class="bg-white rounded-md shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" @click="openModal">
    <img :src="deal.image" :alt="deal.title" class="w-full h-48 object-cover">
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2">{{ deal.title }}</h3>
      <p class="text-gray-600 text-sm mb-2">{{ deal.description }}</p>
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-green-500">{{ deal.price }}</span>
        <div class="flex items-center">
          <button @click.stop="voteDeal(1)" class="text-gray-500 hover:text-green-500 mr-1">
            <i class="fas fa-arrow-up"></i>
          </button>
          <span class="text-sm text-gray-500">{{ deal.votes }}</span>
          <button @click.stop="voteDeal(-1)" class="text-gray-500 hover:text-red-500 ml-1">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
      </div>
      <div class="flex items-center">
        <img v-if="deal.user && deal.user.avatar" :src="deal.user.avatar" :alt="deal.user.name" class="w-6 h-6 rounded-full mr-2">
        <span class="text-sm text-gray-500">{{ deal.user ? deal.user.name : 'Unknown User' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import api from '~/services/api'

const props = defineProps(['deal'])
const emit = defineEmits(['open-modal'])

const voteDeal = async (value) => {
  try {
    await api.post(`/deals/${props.deal._id}/vote`, { value })
    // You might want to update the deal's vote count here
  } catch (error) {
    console.error('Error voting deal:', error)
  }
}

const openModal = () => {
  emit('open-modal', props.deal)
}
</script>
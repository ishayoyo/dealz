<!-- components/FollowedDeals.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-if="followedDeals && followedDeals.length > 0">
      <div v-for="deal in followedDeals" :key="deal._id" class="flex items-center justify-between border-b border-gray-200 py-3">
        <div class="flex items-center">
          <img 
            :src="getFullImageUrl(deal.imageUrl)" 
            :alt="deal.title" 
            class="w-16 h-16 object-cover mr-3 rounded-md"
            @error="handleImageError(deal)"
            loading="lazy"
          >
          <div>
            <h4 class="font-medium">{{ deal.title }}</h4>
            <p class="text-sm text-gray-600">${{ deal.price }}</p>
          </div>
        </div>
        <button @click="$emit('unfollow', deal._id)" class="text-blue-600 hover:text-blue-800">Unfollow</button>
      </div>
    </div>
    <div v-else class="text-center py-4">
      No followed deals found.
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
import { ref } from 'vue'

const props = defineProps({
  followedDeals: {
    type: Array,
    default: () => []
  }
})
defineEmits(['unfollow'])

const config = useRuntimeConfig()
const imageErrors = ref({})

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-deal-image.jpg'
  if (imageUrl.startsWith('http')) return imageUrl
  
  // Remove '/api/v1' from the config.public.apiBase if it exists
  const baseUrl = config.public.apiBase.replace('/api/v1', '')
  
  // For paths starting with '/images/', just prepend the modified base URL
  return `${baseUrl}${imageUrl}`
}

const handleImageError = (deal) => {
  imageErrors.value[deal._id] = true
  deal.imageUrl = '/default-deal-image.jpg'
}
</script>

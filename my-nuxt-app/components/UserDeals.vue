<template>
  <div class="space-y-4">
    <DealCard 
      v-for="deal in userDeals" 
      :key="deal._id" 
      :deal="{ ...deal, user: { ...deal.user, avatarUrl: getAvatarUrl(deal.user._id) } }"
      :username="deal.user.username"
      @open-modal="$emit('dealClicked', deal._id)" 
      class="deal-card cursor-pointer transition duration-300 transform hover:scale-105"
    />
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
import DealCard from '~/components/DealCard.vue'

const props = defineProps(['userDeals'])
const emit = defineEmits(['dealClicked'])

const config = useRuntimeConfig()

const getAvatarUrl = (userId) => {
  return `${config.public.apiBase}/api/v1/users/${userId}/avatar`
}

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-deal-image.jpg'
  if (imageUrl.startsWith('http')) return imageUrl
  
  // Remove '/api/v1' from the config.public.apiBase if it exists
  const baseUrl = config.public.apiBase.replace('/api/v1', '')
  
  return `${baseUrl}${imageUrl}`
}
</script>

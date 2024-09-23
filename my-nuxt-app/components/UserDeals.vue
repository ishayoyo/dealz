<!-- components/UserDeals.vue -->
<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="deal in userDeals" :key="deal._id" class="flex items-center justify-between border-b border-gray-200 py-3">
        <div class="flex items-center">
          <img :src="getFullImageUrl(deal.imageUrl)" :alt="deal.title" class="w-16 h-16 object-cover mr-3 rounded-md">
          <div>
            <h4 class="font-medium">{{ deal.title }}</h4>
            <p class="text-sm text-gray-600">${{ deal.price }}</p>
          </div>
        </div>
        <span class="text-gray-600">{{ deal.upvotes }} upvotes</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRuntimeConfig } from '#app'
  
  const props = defineProps(['userDeals'])
  
  const config = useRuntimeConfig()
  
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    return imageUrl.startsWith('http') 
      ? imageUrl 
      : `${config.public.apiBase}${imageUrl}`
  }
  </script>
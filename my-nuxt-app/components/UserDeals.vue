<template>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="deal in userDeals" :key="deal._id" 
           class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
           @click="$emit('dealClicked', deal._id)">
        <img :src="getFullImageUrl(deal.imageUrl)" :alt="deal.title" class="w-full h-32 object-cover">
        <div class="p-3">
          <h4 class="font-medium text-sm mb-1 truncate">{{ deal.title }}</h4>
          <div class="flex justify-between items-center text-xs">
            <span class="text-green-600 font-bold">${{ deal.price }}</span>
            <span class="text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {{ deal.followCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRuntimeConfig } from '#app'
  
  const props = defineProps(['userDeals'])
  const emit = defineEmits(['dealClicked'])
  
  const config = useRuntimeConfig()
  
  const getFullImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    const baseUrl = getImageBaseUrl()
    return imageUrl.startsWith('http') 
      ? imageUrl 
      : `${baseUrl}${imageUrl}`
  }

  const getImageBaseUrl = () => {
    return config.public.apiBase.includes('localhost') 
      ? 'http://localhost:5000' 
      : 'https://deals.ishay.me'
  }
  </script>
<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" @click="openModal">
    <div class="relative pb-[56.25%]"> <!-- 16:9 aspect ratio -->
      <img :src="fullImageUrl" :alt="deal.title" class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute top-0 right-0 bg-accent text-white px-3 py-1 m-2 rounded-full text-sm font-semibold">
        ${{ formattedPrice }}
      </div>
    </div>
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2 text-text line-clamp-2">{{ deal.title }}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ deal.description }}</p>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-2">
          <img v-if="deal.user && deal.user.profilePicture" :src="userImageUrl" :alt="deal.user.username" class="w-6 h-6 rounded-full">
          <UserAvatar v-else :name="deal.user ? deal.user.username : 'Unknown'" :size="24" />
          <span class="text-sm text-gray-500">{{ deal.user ? deal.user.username : 'Unknown User' }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click.stop="voteDeal(1)" class="text-gray-500 hover:text-secondary transition-colors duration-200">
            <i class="fas fa-arrow-up"></i>
          </button>
          <span class="text-sm font-semibold text-text">{{ deal.voteCount }}</span>
          <button @click.stop="voteDeal(-1)" class="text-gray-500 hover:text-accent transition-colors duration-200">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">
          <i class="far fa-clock mr-1"></i>{{ formattedDate }}
        </span>
        <button class="btn btn-primary">
          View Deal
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import { format } from 'date-fns'
import api from '~/services/api'

const config = useRuntimeConfig()

const props = defineProps(['deal'])
const emit = defineEmits(['open-modal'])

const fullImageUrl = computed(() => {
  if (!props.deal.imageUrl) return '/default-deal-image.jpg' // Add a default image
  return props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `${config.public.apiBase}${props.deal.imageUrl}`
})

const userImageUrl = computed(() => {
  if (!props.deal.user || !props.deal.user.profilePicture) return ''
  return props.deal.user.profilePicture.startsWith('http')
    ? props.deal.user.profilePicture
    : `${config.public.apiBase}${props.deal.user.profilePicture}`
})

const formattedPrice = computed(() => {
  return parseFloat(props.deal.price).toFixed(2)
})

const formattedDate = computed(() => {
  return format(new Date(props.deal.createdAt), 'MMM d, yyyy')
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
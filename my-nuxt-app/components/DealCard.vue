<template>
  <div v-if="deal" class="deal-card group" @click="openModal">
    <div class="relative w-full" style="padding-bottom: 66.67%;">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
      >
      <div class="absolute top-0 right-0 bg-accent-500 text-white px-3 py-1 m-2 rounded-full text-sm font-semibold shadow-md">
        ${{ formattedPrice }}
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="font-heading font-bold text-lg mb-2 text-primary-800 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">{{ deal.title || 'Untitled Deal' }}</h3>
      <p class="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">{{ deal.description || 'No description available' }}</p>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center space-x-2">
          <UserAvatar :name="dealUsername" :size="24" />
          <span class="text-sm text-gray-500">{{ dealUsername }}</span>
        </div>
        <span class="text-sm text-gray-500">
          <i class="far fa-clock mr-1"></i>{{ formattedDate }}
        </span>
      </div>
      <button class="btn btn-primary w-full mt-3 group-hover:shadow-lg transition-shadow duration-300">
        View Deal
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { format } from 'date-fns'

const config = useRuntimeConfig()

const props = defineProps({
  deal: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-modal'])

const imageError = ref(false)

const fullImageUrl = computed(() => {
  if (imageError.value || !props.deal?.imageUrl) return '/default-deal-image.jpg'
  const baseUrl = getImageBaseUrl()
  return props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `${baseUrl}${props.deal.imageUrl}`
})

const handleImageError = () => {
  imageError.value = true
}

const formattedPrice = computed(() => {
  return parseFloat(props.deal?.price || 0).toFixed(2)
})

const formattedDate = computed(() => {
  return format(new Date(props.deal?.createdAt || new Date()), 'MMM d, yyyy')
})

const dealUsername = computed(() => {
  return props.deal?.user?.username || 'Unknown User'
})

const openModal = () => {
  if (props.deal) {
    console.log('DealCard: Emitting open-modal event for deal:', props.deal)
    emit('open-modal', props.deal)
  }
}

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://deals.ishay.me'
}
</script>
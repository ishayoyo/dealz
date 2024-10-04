<template>
  <div v-if="deal" class="deal-card group" @click="openModal">
    <div class="relative w-full aspect-[4/3]">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
      >
      <div class="absolute top-0 left-0 bg-accent-500 text-white px-3 py-1 m-2 rounded-full text-sm font-semibold shadow-md">
        ${{ formattedPrice }}
      </div>
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <h3 class="font-heading font-bold text-lg text-white line-clamp-2 group-hover:text-accent-300 transition-colors duration-300">
          {{ deal.title || 'Untitled Deal' }}
        </h3>
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow">
      <p class="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">{{ deal.description || 'No description available' }}</p>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center space-x-2">
          <UserAvatar :name="dealUsername" :size="24" />
          <span class="text-sm text-gray-500">{{ dealUsername }}</span>
        </div>
        <span class="text-sm text-gray-500 flex items-center">
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
import { formatDistanceToNow } from 'date-fns'

const config = useRuntimeConfig()

const props = defineProps({
  deal: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-modal'])

const imageError = ref(false)

const fullImageUrl = computed(() => 
  imageError.value || !props.deal?.imageUrl
    ? '/default-deal-image.jpg'
    : props.deal.imageUrl.startsWith('http') 
      ? props.deal.imageUrl 
      : `${getImageBaseUrl()}${props.deal.imageUrl}`
)

const handleImageError = () => {
  imageError.value = true
}

const formattedPrice = computed(() => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(props.deal?.price || 0)
)

const formattedDate = computed(() => {
  const date = new Date(props.deal?.createdAt || new Date())
  return formatDistanceToNow(date, { addSuffix: true })
})

const dealUsername = computed(() => props.deal?.user?.username || 'Unknown User')

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
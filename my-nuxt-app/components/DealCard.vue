<template>
  <div v-if="deal" class="deal-card group" @click="openModal">
    <div class="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
        loading="lazy"
      >
      <div class="absolute top-0 left-0 bg-accent-500 text-white px-3 py-1 m-3 rounded-full text-sm font-semibold shadow-md">
        ${{ formattedPrice }}
      </div>
      <div v-if="isNew" class="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 m-3 rounded-full text-xs font-bold shadow-md">
        NEW
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow bg-white rounded-b-lg transition-shadow duration-300 group-hover:shadow-lg">
      <h3 class="font-heading font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">
        {{ deal.title || 'Untitled Deal' }}
      </h3>
      <p class="text-gray-600 text-sm mt-2 mb-3 line-clamp-3 flex-grow">{{ deal.description || 'No description available' }}</p>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center space-x-2">
          <UserAvatar :name="dealUsername" :size="24" />
          <span class="text-sm text-gray-500">{{ dealUsername }}</span>
        </div>
        <span class="text-sm text-gray-500 flex items-center">
          <i class="far fa-clock mr-1"></i>{{ formattedDate }}
        </span>
      </div>
      <button class="btn btn-primary w-full mt-3 group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-0.5">
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

const isNew = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return new Date(props.deal?.createdAt) > oneWeekAgo;
})
</script>

<style scoped>
.deal-card {
  @apply bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl;
}

.btn-primary {
  @apply bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300;
}
</style>
<template>
  <div v-if="deal" class="deal-card group" @click="openDealPage">
    <div class="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
        loading="lazy"
      >
      <div class="absolute top-0 left-0 bg-accent-500 text-white px-4 py-2 m-4 rounded-full text-base font-bold shadow-lg transform transition-transform duration-300 group-hover:scale-110">
        {{ formattedPrice }}
      </div>
      <div v-if="isNew" class="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 m-3 rounded-full text-xs font-bold shadow-md">
        NEW
      </div>
      <div v-if="isHot" class="absolute bottom-0 right-0 bg-red-500 text-white px-3 py-1 m-3 rounded-full text-xs font-bold shadow-md">
        HOT
      </div>
      <div v-if="deal.status === 'pending'" class="absolute bottom-0 left-0 bg-yellow-500 text-white px-3 py-1 m-3 rounded-full text-xs font-bold shadow-md">
        PENDING
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow bg-white rounded-b-lg transition-shadow duration-300 group-hover:shadow-lg">
      <h3 class="font-heading font-bold text-xl text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300 mb-2">
        {{ deal.title || 'Untitled Deal' }}
      </h3>
      <p class="text-gray-600 text-sm mt-1 mb-3 line-clamp-3 flex-grow leading-relaxed">
        {{ deal.description || 'No description available' }}
      </p>
      <div class="flex items-center space-x-2 mb-2">
        <UserAvatar :name="dealUsername" :size="24" />
        <NuxtLink 
          v-if="deal.user && (deal.user['_id'] || deal.user.id)" 
          :to="`/user/${deal.user['_id'] || deal.user.id}`" 
          class="text-sm font-medium text-gray-700 hover:text-primary-600 hover:underline"
          @click.stop
        >
          {{ dealUsername }}
        </NuxtLink>
        <span v-else class="text-sm font-medium text-gray-700">
          {{ dealUsername }}
        </span>
      </div>
      <span class="text-sm text-gray-500 flex items-center mb-3">
        <i class="far fa-clock mr-2"></i>{{ formattedDate }}
      </span>
      <button class="btn btn-primary w-full group-hover:shadow-md transition-all duration-300 transform group-hover:-translate-y-0.5">
        View Deal
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRuntimeConfig, useRouter } from '#app'
import { formatDistanceToNow } from 'date-fns'

const config = useRuntimeConfig()
const router = useRouter()

const props = defineProps({
  deal: {
    type: Object,
    required: true
  },
  username: {
    type: String,
    default: ''
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
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(props.deal?.price || 0)
)

const formattedDate = computed(() => {
  const date = new Date(props.deal?.createdAt || new Date())
  return formatDistanceToNow(date, { addSuffix: true })
})

const dealUsername = computed(() => {
  if (props.deal?.user?.username) {
    return props.deal.user.username;
  } else if (props.deal?.username) {
    return props.deal.username;
  } else if (props.username) {
    return props.username;
  }
  return 'Unknown User';
})

const openDealPage = () => {
  if (props.deal) {
    router.push(`/deals/${props.deal._id || props.deal.id}`)
  }
}

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://deals.ishay.me'
}

const isNew = computed(() => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return new Date(props.deal?.createdAt) > oneDayAgo;
})

const isHot = computed(() => {
  const viewThreshold = 5;
  const commentThreshold = 5;
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentViews = props.deal?.views?.filter(view => new Date(view.createdAt) > oneDayAgo).length || 0;
  const recentComments = props.deal?.comments?.filter(comment => new Date(comment.createdAt) > oneDayAgo).length || 0;

  return recentViews >= viewThreshold && recentComments >= commentThreshold;
})

const isApproved = computed(() => props.deal?.status === 'approved')

// Use a computed property to safely access the deal ID
const dealId = computed(() => props.deal['_id'] || props.deal.id || 'no-id')

// Removed openModal function and its associated button
</script>

<style scoped>
.deal-card {
  @apply bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl;
}

.btn-primary {
  @apply bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300 font-semibold text-sm;
}
</style>

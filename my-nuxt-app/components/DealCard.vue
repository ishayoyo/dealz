<template>
  <div v-if="deal" class="deal-card group cursor-pointer" @click="openDealPage" tabindex="0" @keyup.enter="openDealPage">
    <div class="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
        loading="lazy"
      >
      <div class="absolute top-0 left-0 bg-accent-500 text-white px-4 py-2 m-4 rounded-full text-lg font-bold shadow-lg transform transition-transform duration-300 group-hover:scale-110">
        {{ formattedDealPrice }}
      </div>
      <div class="absolute top-0 right-0 flex flex-col items-end space-y-2 m-4">
        <div v-if="isNew" class="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          NEW
        </div>
        <div v-if="isHot" class="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          HOT
        </div>
        <div v-if="deal.status === 'pending'" class="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          PENDING
        </div>
      </div>
    </div>
    <div class="p-4 flex flex-col flex-grow bg-white rounded-b-lg transition-shadow duration-300 group-hover:shadow-lg">
      <h3 class="font-heading font-bold text-xl text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300 mb-2">
        {{ deal.title || 'Untitled Deal' }}
      </h3>
      <div class="flex items-center justify-between mb-3">
        <div class="flex flex-col">
          <span class="text-gray-500 line-through text-sm">{{ formattedListPrice }}</span>
          <span class="font-bold text-accent text-2xl">{{ formattedDealPrice }}</span>
        </div>
        <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          {{ discountPercentage }}% OFF
        </div>
      </div>
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-500 flex items-center">
          <i class="far fa-clock mr-2"></i>{{ formattedDate }}
        </span>
        <span class="text-sm text-gray-500">{{ formattedShipping }}</span>
      </div>
      <div class="flex items-center">
        <UserAvatar :name="dealUsername" :size="24" class="mr-2" />
        <span class="text-sm text-gray-600">{{ dealUsername }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRuntimeConfig, useRouter } from '#app'
import { formatDistanceToNow } from 'date-fns'
import UserAvatar from './UserAvatar.vue'

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
    : 'https://saversonic.com'
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

const dealId = computed(() => props.deal['_id'] || props.deal.id || 'no-id')

const formattedShipping = computed(() => {
  return props.deal.shipping === 'FREE' ? 'FREE Shipping' : `+$${parseFloat(props.deal.shipping).toFixed(2)} Shipping`
})

const formattedListPrice = computed(() => 
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(props.deal?.listPrice || 0)
)

const formattedDealPrice = computed(() => 
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(props.deal?.price || 0)
)

const discountPercentage = computed(() => {
  if (props.deal?.listPrice && props.deal?.price) {
    return Math.round((1 - props.deal.price / props.deal.listPrice) * 100)
  }
  return 0
})
</script>

<style scoped>
.deal-card {
  @apply bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl;
}

.btn-primary {
  @apply bg-primary-600 text-white py-2 px-4 rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300 font-semibold text-sm;
}

.far {
  @apply text-gray-400;
}
</style>

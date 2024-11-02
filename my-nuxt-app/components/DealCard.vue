<template>
  <div 
    v-if="deal" 
    class="deal-card group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]" 
    @click="openDealPage" 
    tabindex="0" 
    @keyup.enter="openDealPage"
  >
    <!-- Image Container with Enhanced Styling -->
    <div class="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-gray-50">
      <img 
        :src="fullImageUrl" 
        :alt="deal.title" 
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
        loading="lazy"
      >
    </div>

    <!-- Enhanced Price Badge -->
    <div class="absolute top-0 left-0 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-2 m-4 rounded-full text-lg font-bold shadow-lg transform transition-transform duration-300 group-hover:scale-110">
      {{ formattedDealPrice }}
    </div>

    <!-- Enhanced Status Badges -->
    <div class="absolute top-0 right-0 flex flex-col items-end space-y-2 m-4">
      <div v-if="isNew" 
        class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md transform transition-all duration-300 hover:scale-110"
      >
        NEW
      </div>
      <div v-if="isHot" 
        class="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md transform transition-all duration-300 hover:scale-110"
      >
        HOT 🔥
      </div>
      <div v-if="deal.status === 'pending'" 
        class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md transform transition-all duration-300 hover:scale-110"
      >
        PENDING
      </div>
    </div>

    <!-- Enhanced Content Container -->
    <div class="p-6 flex flex-col flex-grow bg-white rounded-b-xl transition-all duration-300 group-hover:shadow-xl">
      <!-- Title with gradient hover effect -->
      <h3 class="font-heading font-bold text-xl text-gray-800 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-primary-800 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 mb-3">
        {{ deal.title || 'Untitled Deal' }}
      </h3>

      <!-- Enhanced Price Display -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex flex-col">
          <span class="font-bold text-accent-600 text-2xl transition-colors duration-300 group-hover:text-accent-700">
            {{ formattedDealPrice }}
          </span>
          <span class="text-gray-500 line-through text-sm">
            {{ formattedListPrice }}
          </span>
        </div>
        <div class="bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transform transition-all duration-300 group-hover:scale-105">
          {{ discountPercentage }}% OFF
        </div>
      </div>

      <!-- Enhanced Time and User Info -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-500 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ formattedDate }}
        </span>
      </div>

      <!-- Enhanced User Info -->
      <div class="flex items-center mt-auto pt-3 border-t border-gray-100">
        <div class="flex items-center w-full">
          <img 
            :src="avatarUrl" 
            :alt="dealUsername" 
            class="w-10 h-10 md:w-12 md:h-12 rounded-full ring-2 ring-primary-50 transition-all duration-300 group-hover:ring-primary-100" 
          />
          <div class="flex flex-col ml-3">
            <span class="text-xs text-gray-400">Posted by</span>
            <NuxtLink 
              :to="isCurrentUser ? '/profile' : `/user/${deal.user?._id}`"
              class="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors duration-300 truncate"
              @click.stop
            >
              {{ dealUsername }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRuntimeConfig, useRouter } from '#app'
import { formatDistanceToNow } from 'date-fns'
import UserAvatar from './UserAvatar.vue'
import api from '~/services/api'
import { useAuthStore } from '~/stores/auth'
import { useAvatars } from '~/composables/useAvatars'

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

const { getAvatar } = useAvatars()
const { $socket } = useNuxtApp()

// Update the avatarUrl computed
const avatarUrl = computed(() => {
  const userId = props.deal?.user?._id
  if (!userId) return 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  return getAvatar(userId)
})

// Simplify the socket handler
onMounted(() => {
  $socket.on('avatarChanged', ({ userId }) => {
    if (props.deal?.user?._id === userId) {
      const { clearCache } = useAvatars()
      clearCache(userId)
    }
  })
})

onUnmounted(() => {
  $socket.off('avatarChanged')
})

// Initialize the auth store
const authStore = useAuthStore()

const isCurrentUser = computed(() => {
  return authStore.user && props.deal?.user?._id === authStore.user._id
})
</script>

<style scoped>
.deal-card {
  @apply bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 h-full flex flex-col;
}

/* Keep only these new styles for consistent card sizing */
.deal-card > div:last-child {
  @apply flex-grow flex flex-col;
}
</style>

<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div 
      class="bg-white rounded-lg w-full overflow-hidden flex flex-col md:flex-row relative"
      :class="modalSizeClass"
      :style="modalStyle"
    >
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-text z-20 bg-white rounded-full p-2 shadow-md transition duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Left column: Image -->
      <div ref="imageContainer" class="w-full md:w-1/2 flex items-center justify-center p-4 bg-gray-100">
        <img 
          :src="imageUrl" 
          :alt="deal.title" 
          @load="onImageLoad" 
          class="w-full h-full object-contain rounded-lg"
          :style="imageStyle"
        >
      </div>
      
      <!-- Right column: Content -->
      <div class="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col">
        <h2 class="text-2xl font-bold mb-2 text-text">{{ deal.title }}</h2>
        <p class="text-gray-600 mb-4">{{ deal.description }}</p>
        
        <div class="flex items-center justify-between mb-4">
          <span class="font-bold text-accent text-2xl">${{ formattedPrice }}</span>
          <a :href="deal.url" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            Go to Deal
          </a>
        </div>
        
        <div class="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
          <button @click="handleFollowDeal" class="btn btn-primary w-full sm:w-auto">
            {{ isFollowing ? 'Unfollow' : 'Follow' }} Deal
          </button>
          <span class="text-sm text-gray-500 whitespace-nowrap">
            {{ formattedFollowCount }} {{ formattedFollowCount === 1 ? 'follower' : 'followers' }}
          </span>
        </div>
        
        <div v-if="deal.user" class="mb-6 flex items-center">
          <UserAvatar :name="dealUserName" :size="40" class="mr-3" />
          <div class="flex-grow">
            <span class="text-sm text-gray-500">Posted by:</span>
            <span class="font-semibold ml-1 text-text">{{ dealUserName }}</span>
          </div>
          <button 
            @click="handleFollowUser" 
            class="btn btn-secondary text-sm"
            :disabled="isCurrentUser"
            :class="{ 'opacity-50 cursor-not-allowed': isCurrentUser }"
          >
            {{ isFollowingUser ? 'Unfollow' : 'Follow' }}
          </button>
        </div>
        
        <div class="border-t border-gray-200 pt-4 flex-grow">
          <h3 class="font-bold text-xl mb-4 text-text">Comments</h3>
          <div v-if="isAuthenticated">
            <div v-if="loading" class="text-gray-500">Loading comments...</div>
            <div v-else-if="error" class="text-red-500">{{ error }}</div>
            <div v-else class="comments-container space-y-4 mb-6 max-h-64 overflow-y-auto">
              <div v-if="comments.length === 0" class="text-gray-500">No comments yet. Be the first to comment!</div>
              <div v-else>
                <Comment v-for="comment in comments" :key="comment._id" :comment="comment" />
              </div>
            </div>
            <div class="mt-4 relative">
              <textarea
                v-model="newComment"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="3"
                placeholder="Add a comment..."
                @input="handleInput"
              ></textarea>
              <UserMentionAutocomplete
                v-if="showMentions"
                :users="mentionableUsers"
                :query="mentionQuery"
                @select="handleUserSelect"
              />
            </div>
            <button @click="handleAddComment" class="btn btn-primary mt-2 w-full">
              Add Comment
            </button>
          </div>
          <div v-else class="text-center py-4">
            <p>Login to view comments</p>
            <button @click="openAuthModal" class="mt-2 btn btn-primary w-full">Login</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#app'
import api from '~/services/api'
import { useToastification } from '~/composables/useToastification'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import Comment from '~/components/Comment.vue'
import UserMentionAutocomplete from '~/components/UserMentionAutocomplete.vue'

const props = defineProps({
  deal: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close-modal', 'open-auth-modal'])

const config = useRuntimeConfig()
const authStore = useAuthStore()
const dealsStore = useDealsStore()
const toast = useToastification()

const comments = ref([])
const isFollowing = ref(false)
const isFollowingUser = ref(false)
const newComment = ref('')
const loading = ref(false)
const error = ref(null)
const mentionableUsers = ref([])
const mentionQuery = ref('')
const showMentions = ref(false)
const imageContainer = ref(null)
const imageStyle = ref({})

const isAuthenticated = computed(() => authStore.isAuthenticated)

const imageUrl = computed(() => {
  if (!props.deal.imageUrl) return ''
  const baseUrl = getImageBaseUrl()
  return props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `${baseUrl}${props.deal.imageUrl}`
})

const formattedPrice = computed(() => {
  return parseFloat(props.deal.price).toFixed(2)
})

const formattedFollowCount = computed(() => {
  return props.deal.followCount || 0
})

const isCurrentUser = computed(() => {
  return authStore.user && props.deal.user && authStore.user._id === props.deal.user._id
})

const dealUserName = computed(() => {
  return props.deal.user && props.deal.user.username ? props.deal.user.username : 'Anonymous'
})

const fetchDealData = async () => {
  loading.value = true
  error.value = null
  try {
    const [commentsResponse, statusResponse, userStatusResponse] = await Promise.all([
      api.get(`/comments/deal/${props.deal._id}`),
      isAuthenticated.value ? api.get(`/deals/${props.deal._id}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } }),
      isAuthenticated.value && props.deal.user ? api.get(`/users/${props.deal.user._id}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } })
    ])
    
    comments.value = commentsResponse.data.data.comments
    if (isAuthenticated.value) {
      isFollowing.value = statusResponse.data.data.isFollowing
      isFollowingUser.value = userStatusResponse.data.data.isFollowing
    } else {
      isFollowing.value = false
      isFollowingUser.value = false
    }
  } catch (err) {
    console.error('Error fetching deal data:', err)
    error.value = 'Failed to load data. Please try again.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

const fetchMentionableUsers = async () => {
  if (!props.deal || !props.deal._id) return
  try {
    const response = await api.get(`/deals/${props.deal._id}/mentionable-users`)
    mentionableUsers.value = response.data.data.users
  } catch (err) {
    console.error('Error fetching mentionable users:', err)
    if (err.response && err.response.status === 401) {
      toast.error('Please log in to view mentionable users')
      // Optionally, you can trigger the auth modal here
      // openAuthModal()
    } else {
      toast.error('Failed to fetch mentionable users')
    }
    mentionableUsers.value = [] // Reset to empty array in case of error
  }
}

const handleInput = (event) => {
  const cursorPosition = event.target.selectionStart
  const textBeforeCursor = newComment.value.slice(0, cursorPosition)
  const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtSymbol !== -1 && lastAtSymbol === textBeforeCursor.lastIndexOf('@')) {
    mentionQuery.value = textBeforeCursor.slice(lastAtSymbol + 1)
    showMentions.value = true
  } else {
    mentionQuery.value = ''
    showMentions.value = false
  }
}

const handleUserSelect = (user) => {
  const cursorPosition = newComment.value.lastIndexOf('@')
  const textBeforeMention = newComment.value.slice(0, cursorPosition)
  const textAfterMention = newComment.value.slice(cursorPosition + mentionQuery.value.length + 1)
  newComment.value = `${textBeforeMention}@${user.username} ${textAfterMention}`
  mentionQuery.value = ''
  showMentions.value = false
}

const handleFollowDeal = () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  followDeal()
}

const followDeal = async () => {
  try {
    if (isFollowing.value) {
      await api.delete(`/deals/${props.deal._id}/follow`)
      props.deal.followCount--
    } else {
      await api.post(`/deals/${props.deal._id}/follow`)
      props.deal.followCount++
    }
    isFollowing.value = !isFollowing.value
    toast.success(isFollowing.value ? 'Deal followed successfully' : 'Deal unfollowed successfully')
  } catch (error) {
    console.error('Error following/unfollowing deal:', error)
    toast.error('An error occurred while following/unfollowing the deal')
  }
}

const handleAddComment = () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  addComment()
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const response = await api.post(`/deals/${props.deal._id}/comments`, { content: newComment.value })
    const newCommentData = response.data.data.comment
    // Add the current user's information to the new comment
    newCommentData.user = {
      _id: authStore.user._id,
      username: authStore.user.username
    }
    comments.value.unshift(newCommentData)
    newComment.value = ''
    toast.success('Comment added successfully')
  } catch (err) {
    console.error('Error adding comment:', err)
    error.value = 'Failed to add comment. Please try again.'
    toast.error(error.value)
  }
}

const closeModal = () => {
  emit('close-modal')
}

const handleFollowUser = () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  if (isCurrentUser.value) {
    toast.info("You can't follow yourself!")
    return
  }
  followUser()
}

const followUser = async () => {
  try {
    if (isFollowingUser.value) {
      await api.delete(`/users/${props.deal.user._id}/follow`)
    } else {
      await api.post(`/users/${props.deal.user._id}/follow`)
    }
    isFollowingUser.value = !isFollowingUser.value
    toast.success(isFollowingUser.value ? 'User followed successfully' : 'User unfollowed successfully')
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    if (error.response && error.response.data) {
      console.error('Error response:', error.response.data)
      toast.error(error.response.data.message || 'An error occurred while following/unfollowing the user')
    } else {
      toast.error('An error occurred while following/unfollowing the user')
    }
  }
}

const onImageLoad = (event) => {
  const img = event.target
  const containerWidth = imageContainer.value.clientWidth
  const containerHeight = imageContainer.value.clientHeight
  const imgAspectRatio = img.naturalWidth / img.naturalHeight
  const containerAspectRatio = containerWidth / containerHeight

  let width, height

  if (imgAspectRatio > containerAspectRatio) {
    width = containerWidth
    height = containerWidth / imgAspectRatio
  } else {
    height = containerHeight
    width = containerHeight * imgAspectRatio
  }

  imageStyle.value = {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  }
}

const openAuthModal = () => {
  emit('open-auth-modal')
}

const modalSizeClass = computed(() => {
  return {
    'max-w-full min-h-screen md:min-h-0': window.innerWidth < 768, // Full screen on mobile
    'max-w-5xl': window.innerWidth >= 768 && window.innerWidth < 1024, // Large screens
    'max-w-6xl': window.innerWidth >= 1024 && window.innerWidth < 1280, // Extra large screens
    'max-w-7xl': window.innerWidth >= 1280, // 2XL screens
  }
})

const modalStyle = computed(() => {
  if (window.innerWidth < 768) {
    return { height: '100%' }
  } else {
    return { height: '90vh', maxHeight: '900px' } // Increased height for desktop
  }
})

const onResize = () => {
  if (imageContainer.value) {
    onImageLoad({ target: imageContainer.value.querySelector('img') })
  }
}

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://dealz-z1n5.onrender.com'
}

onMounted(async () => {
  console.log('DealModal: Mounted')
  if (props.deal && props.deal._id && isAuthenticated.value) {
    await fetchDealData()
    await fetchMentionableUsers()
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

watch(() => [props.deal, isAuthenticated.value], async ([newDeal, newIsAuthenticated], [oldDeal, oldIsAuthenticated]) => {
  console.log('DealModal: Deal prop or authentication state changed:', newDeal, newIsAuthenticated)
  if (newDeal && newDeal._id && newIsAuthenticated && 
      (!oldDeal || newDeal._id !== oldDeal._id || newIsAuthenticated !== oldIsAuthenticated)) {
    try {
      await fetchDealData()
      await fetchMentionableUsers()
    } catch (err) {
      console.error('Error in watch effect:', err)
      error.value = 'An error occurred while loading deal data.'
      toast.error(error.value)
    }
  }
}, { immediate: true, deep: true })
</script>
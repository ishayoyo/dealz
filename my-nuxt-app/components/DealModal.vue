<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div 
      class="bg-white w-full overflow-hidden flex flex-col relative"
      :class="modalSizeClass"
      :style="modalStyle"
    >
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-text z-20 bg-white rounded-full p-2 shadow-md transition duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Scrollable container for modal content -->
      <div class="flex flex-col md:flex-row h-full w-full overflow-y-auto">
        <!-- Image container -->
        <div ref="imageContainer" class="w-full md:w-1/2 flex items-center justify-center p-4 bg-gray-100">
          <img 
            :src="imageUrl" 
            :alt="deal.title" 
            @load="onImageLoad" 
            class="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
            :style="imageStyle"
          >
        </div>
        
        <!-- Content container -->
        <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
          <h2 class="text-2xl md:text-3xl font-bold mb-4 text-text">{{ deal.title }}</h2>
          <p class="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">{{ deal.description }}</p>
          
          <div class="flex items-center justify-between mb-6">
            <span class="font-bold text-accent text-3xl md:text-4xl">${{ formattedPrice }}</span>
            <a :href="deal.url" target="_blank" rel="noopener noreferrer" class="btn btn-primary text-base md:text-lg px-6 md:px-8 py-3 md:py-4 transform hover:scale-105 transition duration-300 shadow-lg">
              GET THIS DEAL
            </a>
          </div>
          
          <div class="flex items-center justify-between mb-6">
            <button @click="handleFollowDeal" class="btn btn-outline-secondary text-sm md:text-base px-4 md:px-6 py-2 md:py-3">
              {{ isFollowing ? 'Unfollow Deal' : 'Follow Deal' }}
            </button>
            <span class="text-sm md:text-base text-gray-500">
              {{ formattedFollowCount }} {{ formattedFollowCount === 1 ? 'follower' : 'followers' }}
            </span>
          </div>
          
          <div v-if="deal.user" class="mb-6 flex items-center justify-between bg-gray-100 p-4 md:p-6 rounded-lg shadow-sm">
            <div class="flex items-center">
              <UserAvatar :name="dealUserName" :size="40" class="mr-3 md:mr-4" />
              <div>
                <span class="text-sm text-gray-500">Posted by:</span>
                <span class="font-semibold ml-1 text-text text-base md:text-lg">{{ dealUserName }}</span>
              </div>
            </div>
            <button 
              @click="handleFollowUser" 
              class="btn btn-outline-secondary text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
              :disabled="isCurrentUser"
              :class="{ 'opacity-50 cursor-not-allowed': isCurrentUser }"
            >
              {{ isFollowingUser ? 'Unfollow User' : 'Follow User' }}
            </button>
          </div>
          
          <div class="border-t border-gray-200 pt-6 flex-grow">
            <h3 class="font-bold text-xl md:text-2xl mb-4 text-text">Comments</h3>
            <div v-if="isAuthenticated">
              <div v-if="loading" class="text-gray-500">Loading comments...</div>
              <div v-else-if="error" class="text-red-500">{{ error }}</div>
              <div v-else class="comments-container space-y-4 mb-6 max-h-64 md:max-h-96 overflow-y-auto bg-gray-50 p-4 md:p-6 rounded-lg shadow-inner">
                <div v-if="comments.length === 0" class="text-gray-500 text-sm md:text-base">No comments yet. Be the first to comment!</div>
                <div v-else>
                  <Comment v-for="comment in comments" :key="comment._id" :comment="comment" class="bg-white p-3 md:p-4 rounded shadow-sm" />
                </div>
              </div>
              <div class="mt-4 relative">
                <textarea
                  v-model="newComment"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                  rows="3"
                  placeholder="Add a comment..."
                  @input="handleInput"
                  :maxlength="MAX_COMMENT_LENGTH"
                ></textarea>
                <div class="text-sm text-gray-500 mt-1">
                  {{ newComment.length }} / {{ MAX_COMMENT_LENGTH }} characters
                </div>
              </div>
              <button 
                @click="handleAddComment" 
                class="btn btn-primary mt-3 w-full text-sm md:text-base"
                :disabled="!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH"
              >
                Add Comment
              </button>
            </div>
            <div v-else class="text-center py-6 bg-gray-100 rounded-lg shadow-inner">
              <p class="mb-3 text-sm md:text-base">Login to view and post comments</p>
              <button @click="openAuthModal" class="btn btn-primary w-full max-w-xs mx-auto text-sm md:text-base">Login</button>
            </div>
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

const MAX_COMMENT_LENGTH = 500

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
    const response = await api[isFollowing.value ? 'delete' : 'post'](`/deals/${props.deal._id}/follow`)
    isFollowing.value = response.data.data.isFollowing
    props.deal.followCount = response.data.data.followCount
    dealsStore.updateDealFollowStatus(props.deal._id, isFollowing.value, props.deal.followCount)
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
  if (!newComment.value.trim() || newComment.value.length > MAX_COMMENT_LENGTH) return
  
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
    if (err.response && err.response.status === 429) {
      error.value = 'Too many comments. Please try again after 5 minutes.'
    } else if (err.response && err.response.data && err.response.data.errors) {
      error.value = err.response.data.errors[0].msg
    } else {
      error.value = 'Failed to add comment. Please try again.'
    }
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
  emit('open-auth-modal', 'login')
}

const modalSizeClass = computed(() => {
  return {
    'h-full rounded-none': window.innerWidth < 768, // Full height on mobile
    'max-w-5xl rounded-lg': window.innerWidth >= 768 && window.innerWidth < 1024,
    'max-w-6xl rounded-lg': window.innerWidth >= 1024 && window.innerWidth < 1280,
    'max-w-7xl rounded-lg': window.innerWidth >= 1280,
  }
})

const modalStyle = computed(() => {
  if (window.innerWidth < 768) {
    return { 
      height: '100%',
      maxHeight: '100%',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
    }
  } else {
    return { 
      maxHeight: '90vh',
      margin: '2rem auto',
    }
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
    : 'https://deals.ishay.me'
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

watch(() => {
  // Safely return an array, even if props.deal or isAuthenticated are undefined
  return [props.deal, isAuthenticated?.value]
}, async (newValues, oldValues) => {
  const [newDeal, newIsAuthenticated] = newValues || []
  const [oldDeal, oldIsAuthenticated] = oldValues || []

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

<style scoped>
@media (max-width: 767px) {
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 transition duration-300 shadow-md hover:shadow-lg;
}

.btn-outline-secondary {
  @apply border border-secondary-500 text-secondary-500 hover:bg-secondary-500 hover:text-white transition duration-300 shadow-sm hover:shadow-md;
}

.comments-container {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #EDF2F7;
}

.comments-container::-webkit-scrollbar {
  width: 6px;
}

.comments-container::-webkit-scrollbar-track {
  background: #EDF2F7;
}

.comments-container::-webkit-scrollbar-thumb {
  background-color: #CBD5E0;
  border-radius: 3px;
  border: 2px solid #EDF2F7;
}
</style>
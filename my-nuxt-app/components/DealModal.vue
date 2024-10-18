  <template>
  <Transition name="modal-fade" appear>
    <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        class="bg-white w-full overflow-hidden flex flex-col relative transform transition-all duration-300"
        :class="[modalSizeClass, { 'scale-95 opacity-0': !isOpen, 'scale-100 opacity-100': isOpen }]"
        :style="modalStyle"
      >
        <DealModalSkeleton v-if="showSkeleton" />
        <template v-else>
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
              
              <!-- Add this section to display prices and shipping -->
              <div class="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div class="p-4 bg-primary-50">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-primary-700 text-3xl md:text-4xl">{{ formattedDealPrice }}</span>
                    <span class="bg-primary-600 text-white font-semibold text-lg px-3 py-1 rounded-full">{{ discountPercentage }}% OFF</span>
                  </div>
                  <div class="flex items-center text-sm text-gray-600">
                    <span class="line-through mr-2">{{ formattedListPrice }}</span>
                    <span class="font-medium text-green-600">
                      {{ deal.shipping === 'FREE' ? 'FREE Shipping' : `+$${deal.shipping} Shipping` }}
                    </span>
                  </div>
                </div>
                
                <div class="p-4 flex items-center justify-between border-t border-gray-200">
                  <span class="text-sm font-medium text-gray-600">Category: <span class="text-primary-600">{{ deal.category }}</span></span>
                </div>
              </div>
              
              <a :href="getOutgoingLink(deal.url)" target="_blank" rel="noopener noreferrer" class="btn btn-primary w-full mb-4">
                GET THIS DEAL
              </a>
              
              <div class="flex items-center justify-between mb-6">
                <button @click="handleFollowDeal" class="btn btn-outline-secondary flex-1 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {{ isFollowing ? 'Following' : 'Follow Deal' }}
                  <span class="ml-2 bg-primary-100 text-primary-800 rounded-full px-2 py-1 text-xs">
                    {{ formattedFollowCount }}
                  </span>
                </button>
                <button @click="handleShareDeal" class="btn btn-outline-secondary flex-1 ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </button>
              </div>
              
              <div v-if="deal.user" class="mb-6 flex items-center justify-between bg-gray-100 p-4 md:p-6 rounded-lg shadow-sm">
                <div class="flex items-center">
                  <img :src="avatarUrl" :alt="dealUserName" class="w-10 h-10 rounded-full mr-3 md:mr-4" />
                  <div>
                    <span class="text-sm text-gray-500">Posted by:</span>
                    <NuxtLink :to="`/user/${deal.user._id}`" class="font-semibold ml-1 text-text text-base md:text-lg hover:text-primary-600 hover:underline">
                      {{ dealUserName }}
                    </NuxtLink>
                  </div>
                </div>
                <button 
                  @click="handleFollowUser" 
                  class="btn btn-outline-secondary"
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
                      <Comment 
                        v-for="comment in comments" 
                        :key="comment.id" 
                        :comment="comment" 
                        class="bg-white p-3 md:p-4 rounded shadow-sm"
                        :show-delete="isAdmin || (authStore.user && comment.user._id === authStore.user._id)"
                        @delete-comment="handleDeleteComment"
                      />
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
                    <UserMentionAutocomplete
                      v-if="showMentions"
                      :users="filteredMentionableUsers"
                      @select="handleUserSelect"
                    />
                    <div class="text-sm text-gray-500 mt-1">
                      {{ newComment.length }} / {{ MAX_COMMENT_LENGTH }} characters
                    </div>
                  </div>
                  <button 
                    @click="handleAddComment" 
                    class="btn btn-primary mt-3 w-full"
                    :disabled="!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH"
                  >
                    Add Comment
                  </button>
                </div>
                <div v-else class="text-center py-6 bg-gray-100 rounded-lg shadow-inner">
                  <p class="mb-3 text-sm md:text-base">Login to view and post comments</p>
                  <button @click="openAuthModal" class="btn btn-primary w-full max-w-xs mx-auto">Login</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Transition>
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
import { useUserFollow } from '~/composables/useUserFollow'
import DealModalSkeleton from '~/components/DealModalSkeleton.vue'
import { useClipboard } from '@vueuse/core'

const props = defineProps({
  deal: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close-modal', 'open-auth-modal', 'update-follow-status', 'follow-deal', 'update:deal', 'delete-comment'])

const config = useRuntimeConfig()
const authStore = useAuthStore()
const dealsStore = useDealsStore()
const toast = useToastification()
const { followUser } = useUserFollow()
const { copy } = useClipboard()

const comments = ref([])
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

const formattedShipping = computed(() => {
  return props.deal.shipping === 'FREE' ? 'FREE' : `$${parseFloat(props.deal.shipping).toFixed(2)}`
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

const isFollowingUser = ref(false)
const isFollowing = ref(false)

watch(() => props.deal, (newDeal) => {
  if (newDeal) {
    isFollowingUser.value = newDeal.isFollowingUser || false
    isFollowing.value = newDeal.isFollowing || false
  }
}, { immediate: true })

watch(() => props.deal.comments, (newComments) => {
  comments.value = newComments
}, { immediate: true, deep: true })

const fetchDealData = async () => {
  loading.value = true
  error.value = null
  try {
    const [commentsResponse, statusResponse, userStatusResponse] = await Promise.all([
      api.get(`/comments/deal/${dealId.value}`),
      isAuthenticated.value ? api.get(`/deals/${dealId.value}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } }),
      isAuthenticated.value && props.deal.user ? api.get(`/users/${props.deal.user._id || props.deal.user.id}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } })
    ])
    
    comments.value = commentsResponse.data.data.comments.map(comment => ({
      ...comment,
      user: {
        ...comment.user,
        _id: comment.user._id || comment.user.id // Ensure we have a consistent _id property
      }
    }))
    isFollowing.value = statusResponse.data.data.isFollowing
    isFollowingUser.value = userStatusResponse.data.data.isFollowing
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
    const response = await api.get(`/comments/deal/${props.deal._id}/mentionable-users`)
    mentionableUsers.value = response.data.data.users
  } catch (err) {
    console.error('Error fetching mentionable users:', err)
    if (err.response && err.response.status === 401) {
      toast.error('Please log in to view mentionable users')
    } else {
      toast.error('Failed to fetch mentionable users')
    }
    mentionableUsers.value = [] // Reset to empty array in case of error
  }
}

const filteredMentionableUsers = computed(() => {
  if (!mentionQuery.value) return []
  return mentionableUsers.value.filter(user => 
    user.username.toLowerCase().includes(mentionQuery.value.toLowerCase())
  )
})

const handleInput = (event) => {
  const cursorPosition = event.target.selectionStart
  const textBeforeCursor = newComment.value.slice(0, cursorPosition)
  const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtSymbol !== -1 && cursorPosition - lastAtSymbol <= 20) {
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

const handleFollowDeal = async () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  try {
    const response = await api[isFollowing.value ? 'delete' : 'post'](`/deals/${dealId.value}/follow`)
    isFollowing.value = response.data.data.isFollowing
    props.deal.followCount = response.data.data.followCount
    emit('follow-deal', { 
      dealId: dealId.value, 
      isFollowing: isFollowing.value, 
      followCount: props.deal.followCount 
    })
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
    console.log('Deal object:', props.deal);
    console.log('Adding comment to deal with ID:', props.deal._id);
    if (!props.deal._id) {
      throw new Error('Deal ID is undefined');
    }
    
    const response = await api.post(`/comments/${props.deal._id}/comments`, { content: newComment.value })
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

const handleFollowUser = async () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  if (isCurrentUser.value) {
    toast.info("You can't follow yourself!")
    return
  }
  const result = await authStore.followUser(props.deal.user._id)
  if (result.success) {
    isFollowingUser.value = result.isFollowing
    emit('update-follow-status', result.isFollowing)
    if (result.followerCount !== undefined) {
      props.deal.user.followerCount = result.followerCount
    }
    toast.success(result.isFollowing ? 'User followed successfully' : 'User unfollowed successfully')
  } else {
    toast.error(result.error || 'An error occurred while following/unfollowing the user')
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
    : 'https://saversonic.com'
}

const dealId = computed(() => props.deal._id || props.deal.id)

const showSkeleton = computed(() => loading.value && !error.value && !comments.value.length)

const isAdmin = computed(() => authStore.user && authStore.user.role === 'admin')

const handleDeleteComment = (commentId) => {
  if (commentId) {
    // Remove the comment from the local array
    comments.value = comments.value.filter(comment => comment.id !== commentId)
    // Emit the delete event to the parent component
    emit('delete-comment', commentId)
    // Update the deal object
    emit('update:deal', { ...props.deal, comments: comments.value })
  } else {
    console.error('Attempted to delete comment with undefined ID')
  }
}

const getOutgoingLink = (url) => {
  // Remove the '/api/v1' from the end of the baseURL
  const baseURL = api.defaults.baseURL.replace(/\/api\/v1$/, '')
  return `${baseURL}/api/v1/link/out?url=${encodeURIComponent(url)}`
}

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

const avatarUrl = ref('')

const fetchAvatar = async () => {
  try {
    const response = await api.get(`/users/${props.deal.user._id}/avatar`)
    avatarUrl.value = response.data.data.avatarUrl
  } catch (error) {
    console.error('Error fetching avatar:', error)
    // Set a default avatar URL in case of error
    avatarUrl.value = 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  }
}

const handleShareDeal = async () => {
  const dealUrl = `${window.location.origin}/deal/${props.deal._id}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.deal.title,
        text: 'Check out this great deal!',
        url: dealUrl,
      })
      toast.success('Deal shared successfully!')
    } catch (error) {
      console.error('Error sharing:', error)
      // Fall back to copying the link if sharing fails
      await copy(dealUrl)
      toast.success('Deal link copied to clipboard!')
    }
  } else {
    // If Web Share API is not supported, just copy the link
    await copy(dealUrl)
    toast.success('Deal link copied to clipboard!')
  }
}

onMounted(() => {
  if (props.deal.user && props.deal.user._id) {
    fetchAvatar()
  }
})

onMounted(async () => {
  console.log('DealModal: Mounted')
  if (props.deal && props.deal._id && isAuthenticated.value) {
    await fetchDealData()
    await fetchMentionableUsers()
  }
  window.addEventListener('resize', onResize)
  console.log('Deal object:', props.deal); // Add this line to verify the deal object
  console.log('DealModal comments:', comments.value)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

watch(() => props.isOpen, async (newIsOpen) => {
  if (newIsOpen && props.deal && props.deal._id && isAuthenticated.value) {
    await fetchDealData()
    await fetchMentionableUsers()
  }
}, { immediate: true })

watch(comments, (newComments) => {
  console.log('Comments updated:', newComments)
}, { deep: true })

// Add this computed property
const isOpen = computed(() => props.isOpen)
</script>

<style scoped>
@media (max-width: 767px) {
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
  }

  .btn-primary,
  .btn-outline-secondary {
    display: block;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .flex.items-center.justify-between {
    flex-direction: column;
    align-items: stretch;
  }

  .flex.items-center.justify-between > * {
    margin-bottom: 0.5rem;
  }
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 transition duration-300 shadow-md hover:shadow-lg;
  @apply text-sm py-2 px-4 rounded-full font-medium tracking-wide;
  @apply transform hover:scale-105 active:scale-95;
}

.btn-outline-secondary {
  @apply border border-secondary-500 text-secondary-500 hover:bg-secondary-500 hover:text-white transition duration-300 shadow-sm hover:shadow-md;
  @apply text-sm py-2 px-4 rounded-full font-medium tracking-wide;
  @apply transform hover:scale-105 active:scale-95;
}

.btn-primary, .btn-outline-secondary {
  @apply flex items-center justify-center;
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}
</style>

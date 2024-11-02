<template>
  <Transition name="modal-fade" appear>
    <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-0 overflow-y-auto">
      <div 
        class="bg-white w-full overflow-hidden flex flex-col relative transform transition-all duration-300"
        :class="[modalSizeClass, { 'scale-95 opacity-0': !isOpen, 'scale-100 opacity-100': isOpen }]"
        :style="modalStyle"
      >
        <!-- Single close button for both mobile and desktop -->
        <button 
          v-if="isDedicatedPage"
          @click="$emit('close-modal')" 
          class="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md transition duration-300 hover:bg-gray-100"
          aria-label="Close modal"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-6 w-6 text-gray-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        <DealModalSkeleton v-if="showSkeleton" />
        <template v-else>
          <!-- Close button - Only show if not on dedicated deal page -->
          <button 
            v-if="!isDedicatedPage" 
            @click="closeModal" 
            class="absolute top-4 right-4 text-gray-700 hover:text-text z-20 bg-white rounded-full p-2 shadow-md transition duration-300"
          >
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
              
              <!-- Price, shipping, and category information -->
              <div class="mb-6">
                <div class="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg shadow-lg p-4">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <!-- Price and discount -->
                    <div class="mb-2 sm:mb-0">
                      <div class="flex items-center flex-wrap">
                        <span class="font-bold text-primary-800 text-2xl sm:text-3xl md:text-4xl mr-2">{{ formattedDealPrice }}</span>
                        <span class="bg-primary-600 text-white font-semibold text-xs md:text-sm px-2 py-1 rounded-full">
                          {{ discountPercentage }}% OFF
                        </span>
                      </div>
                      <span class="text-sm text-gray-600 line-through">{{ formattedListPrice }}</span>
                    </div>
                    
                    <!-- Shipping and category -->
                    <div class="flex flex-col items-start sm:items-end">
                      <span class="text-sm font-medium text-gray-600">
                        Category: <span class="text-primary-600">{{ deal.category }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col sm:flex-row items-center justify-between mb-6">
                <a 
                  :href="getOutgoingLink(deal.url)" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="btn-deal-cta group w-full sm:w-auto mb-2 sm:mb-0 sm:mr-2 relative overflow-hidden"
                  @click="handleGetThisDealClick"
                >
                  <span class="lightning left"></span>
                  <span class="lightning right"></span>
                  <span class="relative z-10 flex items-center justify-center">
                    GET THIS DEAL
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </a>
                
                <div class="flex w-full sm:w-auto">
                  <button @click="handleFollowDeal" class="btn btn-outline-secondary flex-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    {{ isFollowing ? 'Following' : 'Follow' }}
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
              </div>
              
              <div v-if="deal.user" class="mb-6 flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                <div class="flex items-center">
                  <img :src="avatarUrl" :alt="dealUserName" class="w-10 h-10 rounded-full mr-3" />
                  <div>
                    <span class="text-sm text-gray-500">Posted by:</span>
                    <NuxtLink 
                      :to="isCurrentUser ? '/profile' : `/user/${deal.user?._id}`"
                      class="font-semibold ml-1 text-text hover:text-primary-600 hover:underline"
                      @click.stop
                    >
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
              
              <div class="border-t border-gray-200 pt-6 flex flex-col flex-grow">
                <h3 class="font-bold text-xl md:text-2xl mb-4 text-text">Comments</h3>
                <div v-if="isAuthenticated">
                  <div v-if="loading" class="text-gray-500">Loading comments...</div>
                  <div v-else-if="error" class="text-red-500">{{ error }}</div>
                  <!-- Comments container and input section -->
                  <div class="comments-container space-y-4 mb-6 flex-grow overflow-y-auto bg-gray-50 p-4 md:p-6 rounded-lg shadow-inner">
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
                  <!-- Add a sticky container for the comment input and button -->
                  <div 
                    v-if="isAuthenticated" 
                    class="comment-input-container"
                    :class="{ 'mobile-fab': isMobile }"
                  >
                    <!-- Desktop version -->
                    <div v-if="!isMobile" class="sticky bottom-0 bg-white pt-2 pb-4">
                      <div class="relative">
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

                    <!-- Mobile FAB version -->
                    <div v-else>
                      <button 
                        v-if="!showMobileCommentInput"
                        @click="showMobileCommentInput = true"
                        class="fab-button"
                        aria-label="Add comment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>

                      <!-- Mobile comment input overlay -->
                      <div v-else class="mobile-comment-overlay">
                        <div class="mobile-comment-input-container">
                          <div class="flex items-center justify-between mb-2">
                            <h3 class="text-lg font-semibold">Add Comment</h3>
                            <button 
                              @click="showMobileCommentInput = false"
                              class="text-gray-500 hover:text-gray-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <textarea
                            v-model="newComment"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows="4"
                            placeholder="Add a comment..."
                            @input="handleInput"
                            :maxlength="MAX_COMMENT_LENGTH"
                          ></textarea>
                          <div class="text-sm text-gray-500 mt-1">
                            {{ newComment.length }} / {{ MAX_COMMENT_LENGTH }} characters
                          </div>
                          <button 
                            @click="handleMobileAddComment"
                            class="btn btn-primary mt-3 w-full"
                            :disabled="!newComment.trim() || newComment.length > MAX_COMMENT_LENGTH"
                          >
                            Add Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-6 bg-gray-100 rounded-lg shadow-inner mb-20 md:mb-6 flex flex-col items-center">
                  <p class="text-sm md:text-base text-gray-600 mb-4">Please login to view and post comments</p>
                  <button 
                    @click="emit('open-auth-modal', 'login')" 
                    class="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span class="font-medium">Login to Comment</span>
                  </button>
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
import { useHead } from '#app'
import { useWindowSize } from '@vueuse/core'
const { width } = useWindowSize()

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
  },
  subid: {
    type: String,
    default: 'organic'
  },
  isDedicatedPage: {
    type: Boolean,
    default: false
  },
  isAuthenticated: {
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

const formattedFollowCount = computed(() => {
  return props.deal.followCount || 0
})

const isCurrentUser = computed(() => {
  return authStore.user && props.deal?.user?._id === authStore.user._id
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
      _id: comment._id || comment.id, // Ensure we have both _id and id
      id: comment._id || comment.id,
      user: {
        ...comment.user,
        _id: comment.user._id || comment.user.id
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
  if (!isAuthenticated.value) {
    emit('open-auth-modal', 'login')
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
  if (!isAuthenticated.value) {
    emit('open-auth-modal', 'login')
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
  if (!isAuthenticated.value) {
    emit('open-auth-modal', 'login')
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
    'h-full rounded-none': width.value < 768, // Using width from useWindowSize
    'max-w-5xl rounded-lg': width.value >= 768 && width.value < 1024,
    'max-w-6xl rounded-lg': width.value >= 1024 && width.value < 1280,
    'max-w-7xl rounded-lg': width.value >= 1280,
  }
})

const isMobile = computed(() => width.value < 768)

const modalStyle = computed(() => {
  if (isMobile.value) {
    return { 
      height: '100vh',
      maxHeight: '100vh',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
    }
  } else {
    return { 
      maxHeight: '75vh',
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

const handleDeleteComment = async (commentId) => {
  if (!commentId) {
    console.error('Attempted to delete comment with undefined ID')
    return
  }

  try {
    // Remove the comment from the local array immediately for optimistic UI update
    comments.value = comments.value.filter(comment => 
      (comment._id !== commentId && comment.id !== commentId)
    )
    
    // Update the deal object with the new comments array
    const updatedDeal = { 
      ...props.deal, 
      comments: comments.value 
    }
    emit('update:deal', updatedDeal)
    
    toast.success('Comment deleted successfully')
  } catch (error) {
    console.error('Error deleting comment:', error)
    toast.error('Failed to delete comment')
    // Revert the local changes if the API call fails
    await fetchDealData()
  }
}

const getOutgoingLink = (url) => {
  // Remove the '/api/v1' from the end of the baseURL if it exists
  const baseURL = api.defaults.baseURL.replace(/\/api\/v1$/, '');
  
  // Create URL object for proper encoding
  const outgoingUrl = new URL(`${baseURL}/api/v1/link/out`);
  
  // Add parameters
  outgoingUrl.searchParams.append('url', url);
  outgoingUrl.searchParams.append('dealId', props.deal._id);
  
  console.log('Generated outgoing link:', outgoingUrl.toString());
  return outgoingUrl.toString();
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
  const dealUrl = `${window.location.origin}/deals/${props.deal._id}`
  
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
      // Only attempt to copy if it's not a user abort
      if (error.name !== 'AbortError') {
        await copyToClipboard(dealUrl)
      }
    }
  } else {
    await copyToClipboard(dealUrl)
  }
}

const copyToClipboard = async (text) => {
  try {
    await copy(text)
    toast.success('Deal link copied to clipboard!')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    toast.error('Unable to copy link. Please try again.')
  }
}

const handleGetThisDealClick = () => {
  // Remove the emit call for tracking
};

onMounted(() => {
  if (props.deal.user && props.deal.user._id) {
    fetchAvatar()
  }

  // Remove the emit call for tracking
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
  if (newIsOpen && props.deal && props.deal._id) {
    await fetchDealData();
    if (isAuthenticated.value) {
      await fetchMentionableUsers();
    }
  }
}, { immediate: true });

watch(comments, (newComments) => {
  console.log('Comments updated:', newComments)
}, { deep: true })

// Add this computed property
const isOpen = computed(() => props.isOpen)

// Add this computed property for OG meta tags
const ogMetaTags = computed(() => {
  if (!props.deal) return null
  
  const dealUrl = `${window.location.origin}/deals/${props.deal._id}`
  const imageFullUrl = props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `${getImageBaseUrl()}${props.deal.imageUrl}`
  
  return {
    title: props.deal.title,
    description: `I found this great deal at SaverSonic! ${props.deal.title} for only $${props.deal.price} (Was $${props.deal.listPrice})`,
    image: imageFullUrl,
    url: dealUrl,
    type: 'product',
    price: {
      amount: props.deal.price,
      currency: 'USD'
    }
  }
})

// Add useHead to update meta tags
watch(() => props.deal, (newDeal) => {
  if (newDeal) {
    useHead({
      meta: [
        { property: 'og:title', content: ogMetaTags.value.title },
        { property: 'og:description', content: ogMetaTags.value.description },
        { property: 'og:image', content: ogMetaTags.value.image },
        { property: 'og:url', content: ogMetaTags.value.url },
        { property: 'og:type', content: ogMetaTags.value.type },
        { property: 'product:price:amount', content: ogMetaTags.value.price.amount.toString() },
        { property: 'product:price:currency', content: ogMetaTags.value.price.currency },
        // Twitter Card tags
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: ogMetaTags.value.title },
        { name: 'twitter:description', content: ogMetaTags.value.description },
        { name: 'twitter:image', content: ogMetaTags.value.image }
      ]
    })
  }
}, { immediate: true })

// Remove the following computed property if it's not used elsewhere
// const subid = computed(() => { ... });

// Add keyboard support for closing
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    emit('close-modal')
  }
}

// Remove or comment out these touch event handlers and their setup
/*
let touchStartY = 0
const handleTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (!isMobile.value) return
  
  const touchY = e.touches[0].clientY
  const diff = touchY - touchStartY
  
  // If swiping down more than 100px, close the modal
  if (diff > 100) {
    emit('close-modal')
  }
}

onMounted(() => {
  if (isMobile.value) {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
  }
})

onUnmounted(() => {
  if (isMobile.value) {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
  }
})
*/

// Add to the existing script setup
const showMobileCommentInput = ref(false)

const handleMobileAddComment = async () => {
  await handleAddComment()
  showMobileCommentInput.value = false
}
</script>

<style scoped>
/* Add these styles at the top of your style section */
@media (max-width: 767px) {
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .modal-fade-enter-to,
  .modal-fade-leave-from {
    transform: translateY(0);
    opacity: 1;
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
  height: 200px; /* Fixed height for desktop */
  overflow-y: auto;
}

@media (max-width: 767px) {
  .comments-container {
    height: 40vh; /* Responsive height for mobile */
  }
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

/* Add these styles to your existing <style> section */
.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-primary-100 {
  --tw-gradient-from: #e0f2fe;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(224, 242, 254, 0));
}

.to-primary-200 {
  --tw-gradient-to: #bae6fd;
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}

/* Add any other custom styles you need */
.btn-deal-cta {
  @apply text-white font-bold py-4 px-8 rounded-full text-lg;
  background: linear-gradient(135deg, #FF4D4D 0%, #FF8C00 100%);
  transform-style: preserve-3d;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
}

.btn-deal-cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4);
  animation: pulse 2s infinite;
}

.btn-deal-cta:active {
  transform: translateY(1px);
}

.lightning {
  position: absolute;
  width: 10px;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  transform: skewX(-20deg);
  transition: all 0.3s ease;
  opacity: 0;
}

.lightning.left {
  left: -20%;
}

.lightning.right {
  right: -20%;
}

.btn-deal-cta:hover .lightning.left {
  animation: lightningLeft 1.5s infinite;
}

.btn-deal-cta:hover .lightning.right {
  animation: lightningRight 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
  }
  50% {
    box-shadow: 0 4px 25px rgba(255, 77, 77, 0.6);
  }
  100% {
    box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);
  }
}

@keyframes lightningLeft {
  0% {
    left: -20%;
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    left: 120%;
    opacity: 0;
  }
}

@keyframes lightningRight {
  0% {
    right: -20%;
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    right: 120%;
    opacity: 0;
  }
}

/* Add these styles for the close button */
.absolute {
  position: absolute;
}

.top-4 {
  top: 1rem;
}

.right-4 {
  right: 1rem;
}

.z-50 {
  z-index: 50;
}

/* Add hover effect for the close button */
button:hover {
  transform: scale(1.1);
}

button:active {
  transform: scale(0.95);
}

/* Add transition for smooth animations */
button {
  transition: all 0.2s ease-in-out;
}

/* Keep existing styles below */

/* Add to existing styles */
.fab-button {
  position: fixed;
  bottom: 80px; /* Adjust based on your navigation height */
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D4D 0%, #FF8C00 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 999; /* Keep it below the overlay but above other content */
}

.fab-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.fab-button:active {
  transform: scale(0.95);
}

.mobile-comment-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000; /* Increased z-index to be above navigation */
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.mobile-comment-input-container {
  background-color: white;
  padding: 1rem;
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  /* Add margin bottom to account for navigation height */
  margin-bottom: 60px; /* Adjust this value based on your navigation height */
  position: relative;
  z-index: 1001;
}

/* Animation classes */
.mobile-comment-overlay-enter-active,
.mobile-comment-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-comment-overlay-enter-from,
.mobile-comment-overlay-leave-to {
  opacity: 0;
}

.mobile-comment-input-container-enter-active,
.mobile-comment-input-container-leave-active {
  transition: transform 0.3s ease;
}

.mobile-comment-input-container-enter-from,
.mobile-comment-input-container-leave-to {
  transform: translateY(100%);
}
</style>








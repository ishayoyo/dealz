<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg w-full max-w-5xl overflow-hidden flex flex-col md:flex-row relative" :style="modalStyle">
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-text z-20 bg-white rounded-full p-2 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Left column: Image -->
      <div ref="imageContainer" class="w-full md:w-1/2 flex items-center justify-center p-4">
        <img :src="imageUrl" :alt="deal.title" @load="onImageLoad" class="max-w-full max-h-full object-contain">
      </div>
      
      <!-- Right column: Content -->
      <div class="w-full md:w-1/2 p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-2 text-text">{{ deal.title }}</h2>
        <p class="text-gray-600 mb-4">{{ deal.description }}</p>
        
        <div class="flex items-center justify-between mb-4">
          <span class="font-bold text-accent text-2xl">${{ formattedPrice }}</span>
          <a :href="deal.url" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            Go to Deal
          </a>
        </div>
        
        <div class="flex items-center space-x-4 mb-4">
          <button @click="handleFollowDeal" class="btn btn-primary">
            {{ isFollowing ? 'Unfollow' : 'Follow' }} Deal
          </button>
          <span class="text-sm text-gray-500">
            {{ formattedFollowCount }} {{ formattedFollowCount === 1 ? 'follower' : 'followers' }}
          </span>
        </div>
        
        <div class="mb-6 flex items-center" v-if="deal.user">
          <UserAvatar :name="deal.user.username" :size="40" class="mr-3" />
          <div class="flex-grow">
            <span class="text-sm text-gray-500">Posted by:</span>
            <span class="font-semibold ml-1 text-text">{{ deal.user.username }}</span>
          </div>
          <button @click="handleFollowUser" class="btn btn-primary text-sm">
            {{ isFollowingUser ? 'Unfollow' : 'Follow' }}
          </button>
        </div>
        
        <div class="border-t border-gray-200 pt-4">
          <h3 class="font-bold text-xl mb-4 text-text">Comments</h3>
          <div v-if="isAuthenticated">
            <div v-if="loading" class="text-gray-500">Loading comments...</div>
            <div v-else-if="error" class="text-red-500">{{ error }}</div>
            <div v-else class="comments-container space-y-4 mb-6">
              <div v-if="comments.length === 0" class="text-gray-500">No comments yet. Be the first to comment!</div>
              <div v-else v-for="comment in comments" :key="comment.id" class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <UserAvatar :name="comment.user?.username || 'Anonymous'" :size="32" class="mr-3" />
                  <span class="font-semibold text-text">{{ comment.user?.username || 'Anonymous' }}</span>
                  <span class="text-sm text-gray-500 ml-2">{{ formatCommentDate(comment.createdAt) }}</span>
                </div>
                <p class="text-gray-600">{{ comment.content }}</p>
                <div class="flex items-center mt-2 space-x-4">
                  <div class="flex items-center">
                    <button @click="handleVoteComment(comment.id, 1)" :class="{'text-secondary': comment.userVote === 1}" class="hover:text-secondary transition duration-300">
                      <font-awesome-icon icon="arrow-up" />
                    </button>
                    <span class="font-bold mx-2 text-text">{{ comment.voteScore }}</span>
                    <button @click="handleVoteComment(comment.id, -1)" :class="{'text-accent': comment.userVote === -1}" class="hover:text-accent transition duration-300">
                      <font-awesome-icon icon="arrow-down" />
                    </button>
                  </div>
                  <button @click="handleToggleReplyForm(comment.id)" class="text-sm text-primary hover:underline">
                    Reply
                  </button>
                </div>
                <div v-if="replyingTo === comment.id" class="mt-2">
                  <textarea v-model="replyContent" 
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                            rows="2" 
                            placeholder="Write a reply..."></textarea>
                  <div class="mt-2">
                    <button @click="addReply(comment.id)" class="btn btn-primary btn-sm mr-2">
                      Post Reply
                    </button>
                    <button @click="cancelReply" class="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
                <!-- Display replies -->
                <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 ml-4 space-y-2">
                  <div v-for="reply in comment.replies" :key="reply.id" class="bg-gray-100 rounded-lg p-3">
                    <div class="flex items-center mb-1">
                      <UserAvatar :name="reply.user?.username || 'Anonymous'" :size="24" class="mr-2" />
                      <span class="font-semibold text-sm text-text">{{ reply.user?.username || 'Anonymous' }}</span>
                      <span class="text-xs text-gray-500 ml-2">{{ formatCommentDate(reply.createdAt) }}</span>
                    </div>
                    <p class="text-sm text-gray-600">{{ reply.content }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <textarea v-model="newComment" 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                        rows="3" 
                        placeholder="Add a comment..."></textarea>
              <button @click="handleAddComment" class="btn btn-primary mt-2">
                Add Comment
              </button>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p>Login to view comments</p>
            <button @click="openAuthModal" class="mt-2 btn btn-primary">Login</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.max-w-full {
  max-width: 100%;
}
.max-h-full {
  max-height: 100%;
}
.comments-container {
  max-height: 400px;
  overflow-y: auto;
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
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '~/services/api'
import { format } from 'date-fns'
import { useToast } from "vue-toastification";
import { useAuthStore } from '~/stores/auth'

const props = defineProps(['deal'])
const emit = defineEmits(['close-modal'])
const comments = ref([])
const isFollowing = ref(false)
const isFollowingUser = ref(false)
const newComment = ref('')
const loading = ref(false)
const error = ref(null)
const toast = useToast();

const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const imageUrl = computed(() => {
  if (!props.deal.imageUrl) return ''
  return props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `http://localhost:5000${props.deal.imageUrl}`
})

const formattedPrice = computed(() => {
  return parseFloat(props.deal.price).toFixed(2)
})

const formattedFollowCount = computed(() => {
  return props.deal.followCount || 0
})

const formatCommentDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

console.log('DealModal: Received deal prop:', props.deal)

onMounted(async () => {
  console.log('DealModal: Mounted')
  if (props.deal && props.deal._id) {
    await fetchDealData()
  }
})

watch(() => props.deal, async (newDeal) => {
  console.log('DealModal: Deal prop changed:', newDeal)
  if (newDeal && newDeal._id) {
    await fetchDealData()
  }
})

const fetchDealData = async () => {
  try {
    const [commentsResponse, statusResponse, userStatusResponse] = await Promise.all([
      api.get(`/comments/deal/${props.deal._id}`),
      isAuthenticated.value ? api.get(`/deals/${props.deal._id}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } }),
      isAuthenticated.value ? api.get(`/users/${props.deal.user._id}/status`) : Promise.resolve({ data: { data: { isFollowing: false } } })
    ])
    
    comments.value = commentsResponse.data.data.comments
    if (isAuthenticated.value) {
      isFollowing.value = statusResponse.data.data.isFollowing
      isFollowingUser.value = userStatusResponse.data.data.isFollowing
    } else {
      isFollowing.value = false
      isFollowingUser.value = false
    }
    console.log('DealModal: Fetched comments:', comments.value)
    console.log('DealModal: Fetched deal following status:', isFollowing.value)
    console.log('DealModal: Fetched user following status:', isFollowingUser.value)
  } catch (err) {
    console.error('Error fetching deal data:', err)
    error.value = 'Failed to load data. Please try again.'
  } finally {
    loading.value = false
  }
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
  } catch (error) {
    console.error('Error following/unfollowing deal:', error)
    // Add error handling, e.g., show a notification to the user
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
    const response = await api.post(`/comments/${props.deal._id}`, { content: newComment.value })
    const newCommentData = response.data.data.comment
    comments.value.unshift(newCommentData)
    newComment.value = ''
  } catch (err) {
    console.error('Error adding comment:', err)
    error.value = 'Failed to add comment. Please try again.'
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
  } catch (error) {
    console.error('Error following/unfollowing user:', error)
    // Add error handling, e.g., show a notification to the user
  }
}

const imageContainer = ref(null)
const modalStyle = ref({})

const onImageLoad = (event) => {
  const img = event.target
  const aspectRatio = img.naturalWidth / img.naturalHeight
  let modalHeight

  if (aspectRatio > 1) {
    // Landscape image
    modalHeight = Math.min(window.innerHeight * 0.9, img.naturalHeight)
  } else {
    // Portrait image
    modalHeight = Math.min(window.innerHeight * 0.9, img.naturalHeight, 800)
  }

  modalStyle.value = {
    maxHeight: `${modalHeight}px`
  }

  if (imageContainer.value) {
    imageContainer.value.style.height = `${modalHeight}px`
  }
}

const replyingTo = ref(null)
const replyContent = ref('')

const handleToggleReplyForm = (commentId) => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  toggleReplyForm(commentId)
}

const toggleReplyForm = (commentId) => {
  console.log('Toggling reply form for comment:', commentId);
  replyingTo.value = replyingTo.value === commentId ? null : commentId
  replyContent.value = ''
}

const addReply = async (commentId) => {
  console.log('Attempting to add reply to comment:', commentId);
  console.log('Full comment object:', comments.value.find(c => c.id === commentId));
  if (!commentId) {
    console.error('Invalid comment ID');
    toast.error("Cannot add reply: Invalid comment ID");
    return;
  }
  if (!replyContent.value.trim()) {
    toast.error("Reply content cannot be empty");
    return;
  }
  
  try {
    const response = await api.post(`/comments/${commentId}/reply`, { content: replyContent.value })
    console.log('Reply added successfully:', response.data);
    const newReply = response.data.data.reply
    const parentComment = comments.value.find(c => c.id === commentId)
    if (parentComment) {
      if (!parentComment.replies) {
        parentComment.replies = []
      }
      parentComment.replies.push(newReply)
    }
    replyContent.value = ''
    replyingTo.value = null
    // Remove or comment out this line:
    // toast.success("Reply added successfully");
  } catch (err) {
    console.error('Error adding reply:', err.response ? err.response.data : err.message);
    toast.error("Failed to add reply. Please try again.");
  }
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const handleVoteComment = (commentId, value) => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  voteComment(commentId, value)
}

const voteComment = async (commentId, value) => {
  try {
    const response = await api.post(`/comments/${commentId}/vote`, { value })
    const updatedComment = comments.value.find(c => c.id === commentId)
    if (updatedComment) {
      updatedComment.voteScore = response.data.data.voteScore
      updatedComment.voteCount = response.data.data.voteCount
      updatedComment.userVote = value
    }
    // Remove or comment out this line:
    // toast.success(value > 0 ? "Upvoted comment" : "Downvoted comment")
  } catch (error) {
    console.error('Error voting comment:', error)
    toast.error('Failed to vote on comment. Please try again.')
  }
}

const openAuthModal = () => {
  emit('open-auth-modal')
}
</script>
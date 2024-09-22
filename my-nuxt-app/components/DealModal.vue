<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-gray-900 z-20 bg-white rounded-full p-2 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Left column: Image -->
      <div class="w-full md:w-1/2 h-64 md:h-auto relative flex items-center justify-center">
        <img :src="imageUrl" :alt="deal.title" class="max-w-full max-h-full object-contain">
      </div>
      
      <!-- Right column: Content -->
      <div class="w-full md:w-1/2 p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-2">{{ deal.title }}</h2>
        <p class="text-gray-600 mb-4">{{ deal.description }}</p>
        
        <div class="flex items-center justify-between mb-4">
          <span class="font-bold text-green-500 text-2xl">${{ formattedPrice }}</span>
          <a :href="deal.url" target="_blank" rel="noopener noreferrer" class="bg-green-500 text-white rounded-md px-4 py-2 hover:bg-green-600 transition duration-300">
            Go to Deal
          </a>
        </div>
        
        <div class="flex items-center space-x-4 mb-4">
          <button @click="followDeal" class="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300">
            {{ isFollowing ? 'Unfollow' : 'Follow' }} Deal
          </button>
          <div class="flex items-center">
            <button @click="voteDeal(1)" class="text-gray-500 hover:text-green-500 transition duration-300">
              <i class="fas fa-arrow-up text-2xl"></i>
            </button>
            <span class="font-bold text-xl mx-2">{{ deal.voteCount }}</span>
            <button @click="voteDeal(-1)" class="text-gray-500 hover:text-red-500 transition duration-300">
              <i class="fas fa-arrow-down text-2xl"></i>
            </button>
          </div>
        </div>
        
        <div class="mb-6 flex items-center" v-if="deal.user">
          <UserAvatar :name="deal.user.username" :size="40" class="mr-3" />
          <div class="flex-grow">
            <span class="text-sm text-gray-500">Posted by:</span>
            <span class="font-semibold ml-1">{{ deal.user.username }}</span>
          </div>
          <button @click="followUser" class="bg-blue-500 text-white rounded-md px-3 py-1 text-sm hover:bg-blue-600 transition duration-300">
            {{ isFollowingUser ? 'Unfollow' : 'Follow' }}
          </button>
        </div>
        
        <div class="border-t pt-4">
          <h3 class="font-bold text-xl mb-4">Comments</h3>
          <div v-if="loading">Loading comments...</div>
          <div v-else-if="error">{{ error }}</div>
          <div v-else class="comments-container h-64 overflow-y-auto">
            <div v-if="comments.length === 0" class="text-gray-500">No comments yet. Be the first to comment!</div>
            <div v-else v-for="comment in comments" :key="comment._id" class="mb-4 p-3 bg-gray-100 rounded-lg">
              <div class="flex items-center mb-2">
                <UserAvatar 
                  :name="comment.user?.username || 'Anonymous'" 
                  :size="32"
                  class="mr-2"
                />
                <span class="font-semibold">{{ comment.user?.username || 'Anonymous' }}</span>
              </div>
              <p class="text-gray-600">{{ comment.content }}</p>
            </div>
          </div>
          <div class="mt-4">
            <textarea v-model="newComment" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Add a comment..."></textarea>
            <button @click="addComment" class="mt-2 bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition duration-300">
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-container {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #EDF2F7;
}

.comments-container::-webkit-scrollbar {
  width: 8px;
}

.comments-container::-webkit-scrollbar-track {
  background: #EDF2F7;
}

.comments-container::-webkit-scrollbar-thumb {
  background-color: #CBD5E0;
  border-radius: 4px;
}

/* Add this style to remove the background */
.relative.flex.items-center.justify-center {
  background-color: transparent;
}
</style>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '~/services/api'

const props = defineProps(['deal'])
const emit = defineEmits(['close-modal'])
const comments = ref([])
const isFollowing = ref(false)
const isFollowingUser = ref(false)
const newComment = ref('')
const loading = ref(false)
const error = ref(null)

const imageUrl = computed(() => {
  if (!props.deal.imageUrl) return ''
  return props.deal.imageUrl.startsWith('http') 
    ? props.deal.imageUrl 
    : `http://localhost:5000${props.deal.imageUrl}`
})

const formattedPrice = computed(() => {
  return parseFloat(props.deal.price).toFixed(2)
})

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
  loading.value = true
  error.value = null
  try {
    const [commentsResponse, statusResponse, userStatusResponse] = await Promise.all([
      api.get(`/comments/deal/${props.deal._id}`),
      api.get(`/deals/${props.deal._id}/status`),
      api.get(`/users/${props.deal.user._id}/status`)
    ])
    comments.value = commentsResponse.data.data.comments
    isFollowing.value = statusResponse.data.data.isFollowing
    isFollowingUser.value = userStatusResponse.data.data.isFollowing
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

const followDeal = async () => {
  try {
    if (isFollowing.value) {
      await api.delete(`/deals/${props.deal._id}/follow`)
    } else {
      await api.post(`/deals/${props.deal._id}/follow`)
    }
    isFollowing.value = !isFollowing.value
    // Optionally update the follow count if you're displaying it
    props.deal.followCount = isFollowing.value ? (props.deal.followCount || 0) + 1 : (props.deal.followCount || 1) - 1
  } catch (error) {
    console.error('Error following/unfollowing deal:', error)
    // Add error handling, e.g., show a notification to the user
  }
}

const voteDeal = async (value) => {
  try {
    const response = await api.post(`/deals/${props.deal._id}/vote`, { value })
    props.deal.voteCount = response.data.data.voteCount
  } catch (error) {
    console.error('Error voting deal:', error)
  }
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
</script>
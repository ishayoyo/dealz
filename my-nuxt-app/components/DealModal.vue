<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-md w-full max-w-5xl max-h-[90vh] overflow-hidden flex relative">
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-gray-900 z-20 bg-white rounded-md p-2 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Left column: Image -->
      <div class="w-1/2">
        <img :src="deal.imageUrl" :alt="deal.title" class="w-full h-full object-cover">
      </div>
      
      <!-- Right column: Content -->
      <div class="w-1/2 p-8 overflow-y-auto">
        <h2 class="text-3xl font-bold mb-4">{{ deal.title }}</h2>
        <p class="text-gray-600 mb-6">{{ deal.description }}</p>
        
        <div class="flex items-center justify-between mb-6">
          <span class="font-bold text-green-500 text-2xl">{{ deal.price }}</span>
          <div class="flex items-center space-x-4">
            <button @click="followDeal" class="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600">
              {{ isFollowing ? 'Unfollow' : 'Follow' }} Deal
            </button>
            <div class="flex items-center">
              <button @click="voteDeal(1)" class="text-gray-500 hover:text-green-500">
                <i class="fas fa-arrow-up text-2xl"></i>
              </button>
              <span class="font-bold text-xl mx-2">{{ deal.voteCount }}</span>
              <button @click="voteDeal(-1)" class="text-gray-500 hover:text-red-500">
                <i class="fas fa-arrow-down text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mb-6 flex items-center" v-if="deal.user">
          <img :src="deal.user.profilePicture" :alt="deal.user.username" class="w-10 h-10 rounded-full mr-3">
          <div class="flex-grow">
            <span class="text-sm text-gray-500">Posted by:</span>
            <span class="font-semibold ml-1">{{ deal.user.username }}</span>
          </div>
          <button @click="followUser" class="bg-blue-500 text-white rounded-md px-3 py-1 text-sm hover:bg-blue-600">
            {{ isFollowingUser ? 'Unfollow' : 'Follow' }}
          </button>
        </div>
        
        <div class="border-t pt-6">
          <h3 class="font-bold text-xl mb-4">Comments</h3>
          <div v-for="comment in comments" :key="comment._id" class="mb-4">
            <div class="flex items-center mb-2">
              <img :src="comment.user.profilePicture" :alt="comment.user.username" class="w-8 h-8 rounded-full mr-2">
              <span class="font-semibold">{{ comment.user.username }}</span>
            </div>
            <p class="text-gray-600">{{ comment.content }}</p>
          </div>
          <div class="mt-4">
            <textarea v-model="newComment" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Add a comment..."></textarea>
            <button @click="addComment" class="mt-2 bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600">
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '~/services/api'

const props = defineProps(['deal'])
const emit = defineEmits(['close-modal'])
const comments = ref([])
const isFollowing = ref(false)
const isFollowingUser = ref(false)
const newComment = ref('')

const imageUrl = computed(() => {
  return props.deal.imageUrl ? `http://localhost:5000${props.deal.imageUrl}` : ''
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
  try {
    const [commentsResponse, statusResponse] = await Promise.all([
      api.get(`/deals/${props.deal._id}/comments`),
      api.get(`/deals/${props.deal._id}/status`)
    ])
    comments.value = commentsResponse.data.data.comments
    isFollowing.value = statusResponse.data.data.isFollowing
    console.log('DealModal: Fetched comments:', comments.value)
    console.log('DealModal: Fetched following status:', isFollowing.value)
  } catch (error) {
    console.error('Error fetching deal data:', error)
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
  } catch (error) {
    console.error('Error following/unfollowing deal:', error)
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
  try {
    const response = await api.post(`/deals/${props.deal._id}/comments`, { content: newComment.value })
    comments.value.push(response.data.data.comment)
    newComment.value = ''
  } catch (error) {
    console.error('Error adding comment:', error)
  }
}

const closeModal = () => {
  emit('close-modal')
}

// Implement followUser method if needed
const followUser = async () => {
  // Implement user following logic
}
</script>
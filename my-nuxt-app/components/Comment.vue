<template>
  <div class="comment flex justify-between items-start">
    <div>
      <div class="flex items-center mb-2">
        <img 
          :src="avatarUrl" 
          :alt="comment.user.username" 
          class="w-8 h-8 rounded-full mr-2"
        />
        <NuxtLink 
          :to="`/user/${comment.user._id}`"
          class="font-semibold text-primary-600 hover:text-primary-800 transition duration-300"
        >
          {{ comment.user.username }}
        </NuxtLink>
      </div>
      <p class="text-gray-700">{{ comment.content }}</p>
      <span class="text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</span>
    </div>
    <button 
      v-if="showDelete" 
      @click="handleDelete" 
      class="text-red-500 hover:text-red-700 focus:outline-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import api from '~/services/api'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  showDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete-comment'])

const commentId = computed(() => props.comment._id || props.comment.id)

const handleDelete = async () => {
  if (commentId.value) {
    try {
      await api.delete(`/comments/${commentId.value}`)
      emit('delete-comment', commentId.value)
    } catch (err) {
      console.error('Error deleting comment:', err)
      toast.error('Failed to delete comment')
    }
  } else {
    console.error('Comment ID is undefined', props.comment)
  }
}

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Add this computed property to ensure we have a valid user ID
const userId = computed(() => props.comment.user._id || props.comment.user.id)

const avatarUrl = ref('')

const fetchAvatar = async () => {
  try {
    const response = await api.get(`/users/${userId.value}/avatar`)
    avatarUrl.value = response.data.data.avatarUrl
  } catch (error) {
    console.error('Error fetching avatar:', error)
    // Set a default avatar URL in case of error
    avatarUrl.value = 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  }
}

onMounted(() => {
  fetchAvatar()
})
</script>

<style scoped>
.comment :deep(.mention) {
  color: #3b82f6; /* text-blue-500 */
  font-weight: 600; /* font-semibold */
}
</style>

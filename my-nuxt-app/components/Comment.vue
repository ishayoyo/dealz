<template>
  <div class="comment flex justify-between items-start">
    <div>
      <div class="flex items-center mb-2">
        <UserAvatar :name="comment.user.username" :size="32" class="mr-2" />
        <span class="font-semibold">{{ comment.user.username }}</span>
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
import { computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'

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

const commentId = computed(() => props.comment.id)

const handleDelete = () => {
  if (commentId.value) {
    emit('delete-comment', commentId.value)
  } else {
    console.error('Comment ID is undefined', props.comment)
  }
}

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>

<style scoped>
.comment :deep(.mention) {
  color: #3b82f6; /* text-blue-500 */
  font-weight: 600; /* font-semibold */
}
</style>

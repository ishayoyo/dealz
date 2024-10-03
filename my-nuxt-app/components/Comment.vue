<template>
  <div class="comment bg-white rounded-lg shadow-sm p-4 mb-4">
    <div class="flex items-center mb-3">
      <UserAvatar :name="commentUsername" :size="40" class="mr-3" />
      <div>
        <span class="font-semibold text-text">{{ commentUsername }}</span>
        <span class="text-xs text-gray-500 ml-2">{{ formatCommentDate(comment.createdAt) }}</span>
      </div>
    </div>
    <p class="text-gray-700" v-html="formattedContent"></p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  }
})

const authStore = useAuthStore()

const commentUsername = computed(() => {
  if (props.comment.user && props.comment.user.username) {
    return props.comment.user.username
  }
  return authStore.user ? authStore.user.username : 'Anonymous'
})

const formatCommentDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(date).toLocaleDateString(undefined, options)
}

const formattedContent = computed(() => {
  return props.comment.content.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
})
</script>

<style scoped>
.comment :deep(.mention) {
  color: #3b82f6; /* text-blue-500 */
  font-weight: 600; /* font-semibold */
}
</style>
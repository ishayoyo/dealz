<template>
  <div class="comment">
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-center mb-2">
        <UserAvatar :name="commentUsername" :size="32" class="mr-3" />
        <span class="font-semibold text-text">{{ commentUsername }}</span>
        <span class="text-sm text-gray-500 ml-2">{{ formatCommentDate(comment.createdAt) }}</span>
      </div>
      <p class="text-gray-600">{{ comment.content }}</p>
      <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 ml-4 space-y-2">
        <Comment v-for="reply in comment.replies" :key="reply.id" :comment="reply" :disable-voting="disableVoting" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps({
  comment: Object,
  disableVoting: {
    type: Boolean,
    default: false
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
  return new Date(date).toLocaleString()
}
</script>
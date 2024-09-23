```vue:my-nuxt-app/components/Comment.vue
<template>
  <div class="bg-gray-50 rounded-lg p-4">
    <div class="flex items-center mb-2">
      <UserAvatar :name="comment.user?.username || 'Anonymous'" :size="32" class="mr-3" />
      <span class="font-semibold text-text">{{ comment.user?.username || 'Anonymous' }}</span>
      <span class="text-sm text-gray-500 ml-2">{{ formatCommentDate(comment.createdAt) }}</span>
    </div>
    <p class="text-gray-600">{{ comment.content }}</p>
    <div class="flex items-center mt-2 space-x-4">
      <div class="flex items-center">
        <button @click="$emit('vote', comment.id, 1)" :class="{'text-secondary': comment.userVote === 1}" class="hover:text-secondary transition duration-300">
          <font-awesome-icon icon="arrow-up" />
        </button>
        <span class="font-bold mx-2 text-text">{{ comment.voteScore }}</span>
        <button @click="$emit('vote', comment.id, -1)" :class="{'text-accent': comment.userVote === -1}" class="hover:text-accent transition duration-300">
          <font-awesome-icon icon="arrow-down" />
        </button>
      </div>
      <button @click="toggleReplyForm" class="text-sm text-primary hover:underline">
        Reply
      </button>
    </div>
    <div v-if="showReplyForm" class="mt-2">
      <textarea v-model="replyContent" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                rows="2" 
                placeholder="Write a reply..."></textarea>
      <div class="mt-2">
        <button @click="addReply" class="btn btn-primary btn-sm mr-2">
          Post Reply
        </button>
        <button @click="cancelReply" class="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
    <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 ml-4 space-y-2">
      <Comment v-for="reply in comment.replies" :key="reply.id" :comment="reply" @reply="$emit('reply', $event)" @vote="$emit('vote', $event)" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserAvatar from '~/components/UserAvatar.vue'

const props = defineProps(['comment'])
const emit = defineEmits(['reply', 'vote'])
const showReplyForm = ref(false)
const replyContent = ref('')

const formatCommentDate = (date) => {
  return new Date(date).toLocaleString()
}

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value
  replyContent.value = ''
}

const addReply = () => {
  emit('reply', props.comment.id, replyContent.value)
  showReplyForm.value = false
  replyContent.value = ''
}

const cancelReply = () => {
  showReplyForm.value = false
  replyContent.value = ''
}
</script>
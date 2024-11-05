<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6 text-primary-800">Following</h2>
    <div class="space-y-4">
      <div v-if="following.length === 0" class="text-center text-gray-500 py-4">
        You are not following anyone yet.
      </div>
      <div v-else v-for="user in following" :key="user._id" 
           class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 p-4 flex items-center justify-between">
        <div class="flex items-center">
          <UserAvatar 
            :name="user.username" 
            :size="40" 
            :seed="user.avatarSeed"
            :userId="user._id"
            :key="`following-${user._id}-${user.avatarSeed}`"
          />
          <h4 class="font-medium text-sm ml-3 truncate">{{ user.username }}</h4>
        </div>
        <button @click="$emit('unfollow', user._id)" 
                class="btn btn-sm btn-primary">
          Unfollow
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAvatars } from '~/composables/useAvatars'

const props = defineProps({
  following: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['unfollow'])

// Prefetch avatars for all users in the list
const { fetchBatchAvatars } = useAvatars()

onMounted(async () => {
  if (props.following.length > 0) {
    const userIds = props.following.map(user => user._id)
    await fetchBatchAvatars(userIds)
  }
})
</script>

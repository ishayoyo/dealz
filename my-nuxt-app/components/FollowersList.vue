<template>
  <div>
    <h2 class="text-2xl font-semibold mb-6 text-primary-800">Followers</h2>
    <div v-if="followers.length > 0" class="space-y-4">
      <div v-for="follower in followers" :key="follower._id" class="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div class="flex items-center">
          <UserAvatar :name="follower.username" :size="40" :seed="follower.avatarSeed" />
          <span class="ml-4 font-medium">{{ follower.username }}</span>
        </div>
        <button 
          @click="follower.isFollowing ? $emit('unfollow', follower._id) : $emit('follow', follower._id)"
          class="btn btn-sm"
          :class="follower.isFollowing ? 'btn-outline-primary' : 'btn-primary'"
        >
          {{ follower.isFollowing ? 'Following' : 'Follow Back' }}
        </button>
      </div>
    </div>
    <p v-else class="text-center text-gray-500 py-8">You don't have any followers yet.</p>
  </div>
</template>

<script setup>
import UserAvatar from './UserAvatar.vue'

defineProps({
  followers: {
    type: Array,
    required: true
  }
})

defineEmits(['follow', 'unfollow'])
</script>

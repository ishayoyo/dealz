<template>
  <div class="space-y-4">
    <div v-if="followers.length === 0" class="text-center text-gray-500 py-4">
      You don't have any followers yet.
    </div>
    <div v-else v-for="user in followers" :key="user._id" 
         class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 p-4 flex items-center justify-between">
      <div class="flex items-center">
        <UserAvatar 
          :name="user.username" 
          :size="40" 
          :seed="user.avatarSeed"
        />
        <h4 class="font-medium text-sm ml-3 truncate">{{ user.username }}</h4>
      </div>
      <button v-if="!isFollowing(user._id)" @click="$emit('follow', user._id)" 
              class="btn btn-sm btn-secondary">
        Follow Back
      </button>
      <button v-else @click="$emit('unfollow', user._id)" 
              class="btn btn-sm btn-primary">
        Unfollow
      </button>
    </div>
  </div>
</template>

<script setup>
import UserAvatar from '~/components/UserAvatar.vue'

const props = defineProps(['followers', 'followingIds'])
const emit = defineEmits(['follow', 'unfollow'])

const isFollowing = (userId) => {
  return props.followingIds.includes(userId)
}
</script>

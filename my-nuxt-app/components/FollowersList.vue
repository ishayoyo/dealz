<template>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="user in followers" :key="user._id" 
           class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 p-4 flex flex-col items-center">
        <UserAvatar :name="user.username" :src="getFullProfilePictureUrl(user.profilePicture)" :size="60" />
        <h4 class="font-medium text-sm mt-2 mb-1 truncate w-full text-center">{{ user.username }}</h4>
        <button v-if="!isFollowing(user._id)" @click="$emit('follow', user._id)" 
                class="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors duration-300">
          Follow Back
        </button>
        <button v-else @click="$emit('unfollow', user._id)" 
                class="mt-2 text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded-full transition-colors duration-300">
          Unfollow
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRuntimeConfig } from '#app'
  
  const props = defineProps(['followers', 'followingIds'])
  const emit = defineEmits(['follow', 'unfollow'])
  
  const config = useRuntimeConfig()
  
  const getFullProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return ''
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${config.public.apiBase}${profilePicture}`
  }
  
  const isFollowing = (userId) => {
    return props.followingIds.includes(userId)
  }
  </script>
<template>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="user in following" :key="user._id" 
           class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 p-4 flex flex-col items-center">
        <UserAvatar :name="user.username" :src="getFullProfilePictureUrl(user.profilePicture)" :size="60" />
        <h4 class="font-medium text-sm mt-2 mb-1 truncate w-full text-center">{{ user.username }}</h4>
        <button @click="$emit('unfollow', user._id)" 
                class="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-colors duration-300">
          Unfollow
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRuntimeConfig } from '#app'
  
  const props = defineProps(['following'])
  const emit = defineEmits(['unfollow'])
  
  const config = useRuntimeConfig()
  
  const getFullProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return ''
    return profilePicture.startsWith('http') 
      ? profilePicture 
      : `${config.public.apiBase}${profilePicture}`
  }
  </script>
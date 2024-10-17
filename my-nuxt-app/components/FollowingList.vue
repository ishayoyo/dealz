<template>
  <div class="space-y-4">
    <div v-for="user in following" :key="user._id" 
         class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 p-4 flex items-center justify-between">
      <div class="flex items-center">
        <UserAvatar :name="user.username" :size="40" :seed="user.avatarSeed" />
        <h4 class="font-medium text-sm ml-3 truncate">{{ user.username }}</h4>
      </div>
      <button @click="$emit('unfollow', user._id)" 
              class="btn btn-sm btn-primary">
        Unfollow
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['following'])
const emit = defineEmits(['unfollow'])
</script>

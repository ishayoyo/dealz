<template>
    <div class="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
      <ul>
        <li
          v-for="user in filteredUsers"
          :key="user._id"
          @click="selectUser(user)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {{ user.username }}
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    users: Array,
    query: String,
  });
  
  const emit = defineEmits(['select']);
  
  const filteredUsers = computed(() => {
    if (!props.query) return props.users;
    return props.users.filter(user => 
      user.username.toLowerCase().includes(props.query.toLowerCase())
    );
  });
  
  const selectUser = (user) => {
    emit('select', user);
  };
  </script>
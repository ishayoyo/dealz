<template>
    <button 
      @click="$emit('click')" 
      class="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition duration-300 z-50 md:hidden"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </template>
  
  <script setup>
  defineEmits(['click'])
  </script>
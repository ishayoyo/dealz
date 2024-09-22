<!-- components/UserAvatar.vue -->
<template>
    <img :src="avatarUrl" :alt="name" class="rounded-full" :class="sizeClass">
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 40
    },
    background: {
      type: String,
      default: 'random'
    }
  })
  
  const avatarUrl = computed(() => {
    const encodedName = encodeURIComponent(props.name)
    return `https://ui-avatars.com/api/?name=${encodedName}&size=${props.size}&background=${props.background}&color=ffffff`
  })
  
  const sizeClass = computed(() => {
    return `w-${props.size / 4} h-${props.size / 4}`
  })
  </script>
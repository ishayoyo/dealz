<!-- components/UserAvatar.vue -->
<template>
  <div :class="avatarClasses" :style="avatarStyle">
    <span v-if="!imageLoaded" class="text-white">{{ initials }}</span>
    <img v-if="src" :src="src" @load="onImageLoad" @error="onImageError" class="w-full h-full object-cover" :alt="name">
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 40
  },
  src: {
    type: String,
    default: ''
  }
});

const imageLoaded = ref(false);

const initials = computed(() => {
  return props.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

const avatarClasses = computed(() => {
  return [
    'flex items-center justify-center rounded-full overflow-hidden bg-primary-500 text-white',
    `w-${props.size / 4} h-${props.size / 4}`
  ];
});

const avatarStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${props.size / 2.5}px`
  };
});

const onImageLoad = () => {
  imageLoaded.value = true;
};

const onImageError = () => {
  imageLoaded.value = false;
};
</script>
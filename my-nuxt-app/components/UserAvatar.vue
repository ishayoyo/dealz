<!-- components/UserAvatar.vue -->
<template>
  <div :class="avatarClasses" :style="avatarStyle">
    <img :src="avatarUrl" class="w-full h-full object-cover" :alt="name">
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 40
  },
  seed: {
    type: String,
    required: false
  }
});

const avatarClasses = computed(() => {
  return [
    'rounded-full overflow-hidden',
    `w-${props.size / 4} h-${props.size / 4}`
  ];
});

const avatarStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  };
});

const avatarUrl = computed(() => {
  // Use the seed from props if provided, otherwise use the one from the auth store
  const seedToUse = props.seed || authStore.user?.avatarSeed || 'default';
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=${seedToUse}`;
});
</script>

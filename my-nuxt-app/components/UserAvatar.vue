<!-- components/UserAvatar.vue -->
<template>
  <div :class="avatarClasses" :style="avatarStyle">
    <img :src="avatarUrl" class="w-full h-full object-cover" :alt="name">
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAvatars } from '~/composables/useAvatars';

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
  },
  userId: {
    type: String,
    required: false
  }
});

const { getAvatar, cacheVersion } = useAvatars();

const avatarClasses = computed(() => ([
  'rounded-full overflow-hidden',
  `w-${props.size / 4} h-${props.size / 4}`
]));

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

const avatarUrl = computed(() => {
  // Use cacheVersion to trigger re-render when cache updates
  cacheVersion.value;
  return getAvatar(props.userId, props.seed);
});
</script>

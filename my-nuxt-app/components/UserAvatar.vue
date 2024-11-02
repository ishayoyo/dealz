<!-- components/UserAvatar.vue -->
<template>
  <div :class="avatarClasses" :style="avatarStyle">
    <img :src="avatarUrl" class="w-full h-full object-cover" :alt="name">
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

const avatarCache = {
  get(seed) {
    const cached = localStorage.getItem(`avatar_${seed}`);
    if (cached) {
      const { url, timestamp } = JSON.parse(cached);
      // Check if the cache is less than a day old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return url;
      }
    }
    return null;
  },
  set(seed, url) {
    localStorage.setItem(`avatar_${seed}`, JSON.stringify({ url, timestamp: Date.now() }));
  }
};

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
  if (props.seed) {
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${props.seed}`
  }
  return `https://api.dicebear.com/6.x/avataaars/svg?seed=${props.name}`
});

const avatarKey = ref(0)

onMounted(() => {
  const { $socket } = useNuxtApp()
  
  $socket.on('avatarChanged', ({ userId }) => {
    // Force re-render by updating the key
    avatarKey.value++
  })
})

onUnmounted(() => {
  const { $socket } = useNuxtApp()
  $socket.off('avatarChanged')
})
</script>

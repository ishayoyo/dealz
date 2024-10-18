<!-- components/UserAvatar.vue -->
<template>
  <div :class="avatarClasses" :style="avatarStyle">
    <img :src="avatarUrl" class="w-full h-full object-cover" :alt="name">
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
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
  const seedToUse = props.seed || authStore.user?.avatarSeed || 'default';
  
  // Check cache first
  const cachedUrl = avatarCache.get(seedToUse);
  if (cachedUrl) {
    return cachedUrl;
  }

  // If not in cache, generate new URL
  const newUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seedToUse}`;
  
  // Cache the new URL
  avatarCache.set(seedToUse, newUrl);
  
  return newUrl;
});

watch(() => props.seed || authStore.user?.avatarSeed, (newSeed) => {
  if (newSeed) {
    avatarUrl.value = avatarCache.get(newSeed) || `https://api.dicebear.com/6.x/avataaars/svg?seed=${newSeed}`;
  }
});
</script>

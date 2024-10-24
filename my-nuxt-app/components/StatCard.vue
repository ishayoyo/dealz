<template>
  <div class="stat-card bg-white p-4 rounded-xl shadow-md">
    <h3 class="text-lg font-semibold text-gray-700">{{ title }}</h3>
    <p class="text-2xl font-bold text-primary-600">
      {{ prefix }}{{ formattedValue }}{{ suffix }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  decimals: {
    type: Number,
    default: 2
  }
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toFixed(props.decimals);
  }
  return props.value;
});
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>


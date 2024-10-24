<template>
  <div class="date-range-picker">
    <input type="date" v-model="startDate" @change="emitUpdate" />
    <span>to</span>
    <input type="date" v-model="endDate" @change="emitUpdate" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ startDate: null, endDate: null }),
  },
});

const emit = defineEmits(['update:modelValue']);

const startDate = ref(props.modelValue.startDate);
const endDate = ref(props.modelValue.endDate);

const emitUpdate = () => {
  emit('update:modelValue', { startDate: startDate.value, endDate: endDate.value });
};

watch(() => props.modelValue, (newValue) => {
  startDate.value = newValue.startDate;
  endDate.value = newValue.endDate;
}, { deep: true });
</script>

<style scoped>
.date-range-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>


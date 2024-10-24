<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-xl max-w-md w-full">
      <h3 class="text-xl font-semibold mb-4">{{ pixel._id ? 'Edit' : 'Add' }} S2S Pixel</h3>
      <form @submit.prevent="savePixel">
        <div class="mb-4">
          <label class="block mb-2" for="network">Network</label>
          <input id="network" v-model.trim="localPixel.network" class="input-field" required>
        </div>
        <div class="mb-4">
          <label class="block mb-2" for="event">Event</label>
          <input id="event" v-model.trim="localPixel.event" class="input-field" required>
        </div>
        <div class="mb-4">
          <label class="block mb-2" for="url">Pixel URL</label>
          <input id="url" v-model.trim="localPixel.url" class="input-field" required>
        </div>
        <div class="flex justify-end space-x-2">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  pixel: {
    type: Object,
    default: () => ({ network: '', event: '', url: '' }) // Ensure default values
  }
});

const emit = defineEmits(['close', 'save']);

const localPixel = ref({ ...props.pixel });

watch(() => props.pixel, (newPixel) => {
  localPixel.value = { ...newPixel };
}, { deep: true });

const savePixel = () => {
  console.log('Local pixel before save:', localPixel.value); // Debugging log
  if (!localPixel.value.network || !localPixel.value.event || !localPixel.value.url) {
    alert('Please fill in all fields');
    return;
  }
  emit('save', localPixel.value);
};
</script>

<style scoped>
.input-field {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.btn {
  @apply font-bold py-2 px-4 rounded transition duration-150 ease-in-out;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-700;
}
</style>

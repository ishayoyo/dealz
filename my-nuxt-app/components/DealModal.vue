<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold">{{ deal.title }}</h2>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <img :src="deal.image" :alt="deal.title" class="w-full h-64 object-cover rounded-lg mb-4">
        <p class="text-gray-600 mb-4">{{ deal.description }}</p>
        <div class="flex items-center justify-between mb-4">
          <span class="font-bold text-green-500 text-xl">{{ deal.price }}</span>
          <button class="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600">
            Follow Deal
          </button>
        </div>
        <div class="border-t pt-4">
          <h3 class="font-bold text-lg mb-2">Comments</h3>
          <!-- Add comments component here -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['deal'],
  methods: {
    closeModal() {
      this.$emit('close-modal')
    }
  }
}
</script>
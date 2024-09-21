<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" @click="openModal">
    <img :src="deal.image" :alt="deal.title" class="w-full h-48 object-cover">
    <div class="p-4">
      <h3 class="font-bold text-lg mb-2">{{ deal.title }}</h3>
      <p class="text-gray-600 text-sm mb-2">{{ deal.description }}</p>
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-green-500">{{ deal.price }}</span>
        <div class="flex items-center">
          <i class="fas fa-arrow-up text-green-500 mr-1"></i>
          <span class="text-sm text-gray-500">{{ deal.upvotes }}</span>
        </div>
      </div>
      <div class="flex items-center">
        <img :src="deal.userAvatar" :alt="deal.postedBy" class="w-6 h-6 rounded-full mr-2">
        <span class="text-sm text-gray-500">{{ deal.postedBy }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['deal'],
  methods: {
    openModal() {
      this.$emit('open-modal', this.deal)
    }
  }
}
</script>
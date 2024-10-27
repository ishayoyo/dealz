<template>
  <div 
    class="flex flex-wrap gap-2 mb-6"
    :class="{
      'sm:pt-4': !isAuthenticated,  // Small padding after hero section
      'sm:pt-0': isAuthenticated    // No extra padding when no hero
    }"
  >
    <button
      v-for="category in categories"
      :key="category"
      @click="toggleCategory(category)"
      class="btn btn-sm"
      :class="selectedCategories.includes(category) ? 'btn-primary' : 'btn-secondary'"
    >
      {{ category }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedCategories'])

const categories = [
  "Electronics",
  "Home",
  "Fashion",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Travel",
  "Food",
  "Auto",
  "DIY",
  "Pets",
  "Other"
]

const selectedCategories = ref([])

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category)
  if (index === -1) {
    selectedCategories.value.push(category)
  } else {
    selectedCategories.value.splice(index, 1)
  }
  emit('update:selectedCategories', selectedCategories.value)
}
</script>

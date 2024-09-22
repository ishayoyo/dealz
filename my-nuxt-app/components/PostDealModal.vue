<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-2xl p-8 relative">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h2 class="text-3xl font-bold mb-6 text-center text-blue-600">
        {{ step === 1 ? 'Post a New Deal' : 'Complete Deal Details' }}
      </h2>

      <!-- Step 1: Enter deal link -->
      <div v-if="step === 1">
        <p class="text-center text-gray-600 mb-6">
          Enter the link to the deal you want to share
        </p>
        <form @submit.prevent="fetchDealInfo">
          <div class="mb-4">
            <label for="dealLink" class="block text-gray-700 text-sm font-bold mb-2">Deal Link</label>
            <input type="url" id="dealLink" v-model="dealLink" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
            Next
          </button>
        </form>
      </div>

      <!-- Step 2: Complete deal details -->
      <div v-else>
        <div class="mb-6">
          <img v-if="dealImage" :src="dealImage" alt="Deal Image" class="w-full h-48 object-cover rounded-md mb-2">
          <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md mb-2">
            <span class="text-gray-500">No image available</span>
          </div>
          <div class="flex justify-between">
            <button @click="triggerFileInput" class="text-blue-600 hover:text-blue-800">
              {{ dealImage ? 'Replace Image' : 'Upload Image' }}
            </button>
            <button v-if="dealImage" @click="removeImage" class="text-red-600 hover:text-red-800">
              Remove Image
            </button>
          </div>
          <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*">
        </div>

        <form @submit.prevent="submitDeal">
          <div class="mb-4">
            <label for="title" class="block text-gray-700 text-sm font-bold mb-2">Deal Title</label>
            <input type="text" id="title" v-model="dealDetails.title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          
          <div class="mb-4">
            <label for="description" class="block text-gray-700 text-sm font-bold mb-2">Description</label>
            <textarea id="description" v-model="dealDetails.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
          </div>
          
          <div class="mb-4">
            <label for="price" class="block text-gray-700 text-sm font-bold mb-2">Price</label>
            <input type="text" id="price" v-model="dealDetails.price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          
          <div class="mb-6">
            <label for="category" class="block text-gray-700 text-sm font-bold mb-2">Category</label>
            <select id="category" v-model="dealDetails.category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home">Home & Garden</option>
              <option value="toys">Toys & Games</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300">
            Post Deal
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '~/services/api'

const emit = defineEmits(['close', 'post-deal'])

const step = ref(1)
const dealLink = ref('')
const dealImage = ref('')
const fileInput = ref(null)

const dealDetails = reactive({
  title: '',
  description: '',
  price: '',
  category: ''
})

const fetchDealInfo = async () => {
  try {
    const response = await api.post('/deals/fetch-image', { url: dealLink.value })
    dealImage.value = `http://localhost:5000${response.data.data.imageUrl}`
    step.value = 2
  } catch (error) {
    console.error('Error fetching deal image:', error)
    // Handle error (e.g., show error message to user)
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await api.post('/deals/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      dealImage.value = `http://localhost:5000${response.data.data.imageUrl}`
    } catch (error) {
      console.error('Error uploading image:', error)
      // Handle error (e.g., show error message to user)
    }
  }
}

const removeImage = () => {
  dealImage.value = ''
}

const submitDeal = async () => {
  try {
    const dealData = {
      ...dealDetails,
      imageUrl: dealImage.value,
      link: dealLink.value
    }
    const response = await api.post('/deals', dealData)
    emit('post-deal', response.data.data.deal)
    emit('close')
  } catch (error) {
    console.error('Error posting deal:', error)
    // Handle error (e.g., show error message to user)
  }
}
</script>
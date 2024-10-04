<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-lg w-full max-w-2xl p-6 sm:p-8 relative shadow-lg">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-center text-primary-600">
        {{ step === 1 ? 'Post a New Deal' : 'Complete Deal Details' }}
      </h2>

      <!-- Step 1: Enter deal link -->
      <div v-if="step === 1">
        <p class="text-center text-gray-600 mb-4 sm:mb-6">
          Enter the link to the deal you want to share
        </p>
        <form @submit.prevent="fetchDealInfo">
          <div class="mb-4">
            <label for="dealLink" class="block text-gray-700 text-sm font-bold mb-2">Deal Link</label>
            <input type="url" id="dealLink" v-model="dealLink" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          <button type="submit" :disabled="isLoading" class="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition duration-300">
            {{ isLoading ? 'Posting...' : 'Next' }}
          </button>
        </form>
      </div>

      <!-- Step 2: Complete deal details -->
      <div v-else>
        <div class="mb-4 sm:mb-6">
          <div class="w-full h-48 sm:h-64 flex items-center justify-center mb-2 overflow-hidden">
            <img v-if="dealImage" :src="dealImage" alt="Deal Image" class="max-w-full max-h-full object-contain">
            <span v-else-if="isLoading" class="text-gray-500">Loading image...</span>
            <span v-else class="text-gray-500">No image available</span>
          </div>
          <div class="flex justify-between">
            <button @click="triggerFileInput" class="text-blue-600 hover:text-blue-800 text-sm sm:text-base">
              {{ dealImage ? 'Replace Image' : 'Upload Image' }}
            </button>
            <button v-if="dealImage" @click="removeImage" class="text-red-600 hover:text-red-800 text-sm sm:text-base">
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
            <label for="price" class="block text-gray-700 text-sm font-bold mb-2">Price ($)</label>
            <input type="number" id="price" v-model="dealDetails.price" step="0.01" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          
          <button type="submit" class="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition duration-300">
            {{ isLoading ? 'Posting...' : 'Submit for Review' }}
          </button>
          <p class="text-sm text-gray-500 mt-2">Your deal will be reviewed by an admin before it's published.</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import api from '~/services/api'
import { useToastification } from '~/composables/useToastification'
import { useDealsStore } from '~/stores/deals'
import { useRuntimeConfig } from '#app'

const emit = defineEmits(['close'])

const step = ref(1)
const dealLink = ref('')
const dealImage = ref('')
const fileInput = ref(null)
const isLoading = ref(false)

const dealDetails = reactive({
  title: '',
  description: '',
  price: ''
})

const toast = useToastification()
const dealsStore = useDealsStore()
const config = useRuntimeConfig()

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://deals.ishay.me'
}

const fetchDealInfo = async () => {
  isLoading.value = true
  try {
    const response = await api.post('/deals/fetch-image', { url: dealLink.value })
    const imageBaseUrl = getImageBaseUrl()
    dealImage.value = `${imageBaseUrl}${response.data.data.imageUrl}`
  } catch (error) {
    console.error('Error fetching deal image:', error)
    toast.error('Failed to fetch deal image. You can upload an image manually.')
  } finally {
    isLoading.value = false
    step.value = 2
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    isLoading.value = true
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await api.post('/deals/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      const imageBaseUrl = getImageBaseUrl()
      dealImage.value = `${imageBaseUrl}${response.data.data.imageUrl}`
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      isLoading.value = false
    }
  }
}

const removeImage = () => {
  dealImage.value = ''
  toast.info('Image removed')
}

const submitDeal = async () => {
  try {
    const imageBaseUrl = getImageBaseUrl()
    const dealData = {
      ...dealDetails,
      price: parseFloat(dealDetails.price).toFixed(2),
      imageUrl: dealImage.value.replace(imageBaseUrl, ''), // Remove the base URL
      link: dealLink.value
    }
    const response = await api.post('/deals', dealData)
    const newDeal = response.data.data.deal
    console.log('New deal from API:', newDeal)
    dealsStore.handleNewDeal(newDeal)
    emit('close')
    toast.success('Deal submitted for review!')
  } catch (error) {
    console.error('Error submitting deal:', error)
    toast.error('Failed to submit deal. Please try again.')
  }
}

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

watch(() => props.show, (newValue) => {
  console.log('PostDealModal show prop changed:', newValue)
})
</script>

<style scoped>
.max-w-full {
  max-width: 100%;
}
.max-h-full {
  max-height: 100%;
}
.fixed {
  z-index: 1000;
}
</style>
<template>
  <!-- Add this hidden file input -->
  <input 
    type="file"
    ref="fileInput"
    @change="handleFileChange"
    accept="image/*"
    class="hidden"
  />

  <!-- Rest of your modal template -->
  <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
    <div class="bg-white rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl transform transition-all mt-8">
      <!-- Enhanced close button -->
      <button @click="$emit('close')" class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <!-- Enhanced header with gradient text -->
      <h2 class="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
        {{ step === 1 ? '🎯 Post a New Deal' : '✨ Complete Deal Details' }}
      </h2>

      <!-- Step 1: Enter deal link -->
      <div v-if="step === 1">
        <p class="text-center text-gray-600 mb-8 max-w-sm mx-auto">
          Share an amazing deal with our community by entering the product link below
        </p>
        <form @submit.prevent="fetchDealInfo" class="space-y-6">
          <div>
            <label for="dealLink" class="block text-sm font-medium text-gray-700 mb-1">Deal Link</label>
            <input 
              type="url" 
              id="dealLink" 
              v-model="dealLink" 
              class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/product"
              required
            >
          </div>
          
          <!-- Enhanced button -->
          <button 
            type="submit" 
            :disabled="isLoading" 
            class="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50"
          >
            <span v-if="!isLoading">Next</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Fetching image...
            </span>
          </button>
          
          <!-- Enhanced progress bar -->
          <div v-if="isLoading" class="mt-4 space-y-2">
            <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 rounded-full"
                :style="{ width: `${Math.min(progressValue, 100)}%` }"
              ></div>
            </div>
            <p class="text-center text-sm text-gray-600">
              {{ Math.round(progressValue) }}% - Analyzing webpage...
            </p>
          </div>
        </form>
      </div>

      <!-- Step 2: Complete deal details -->
      <div v-else class="space-y-6">
        <!-- Enhanced image container -->
        <div class="w-full h-64 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center mb-2 overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
          <img v-if="dealImage" :src="dealImage" alt="Deal Image" class="max-w-full max-h-full object-contain">
          <div v-else class="text-center p-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="mt-1 text-sm text-gray-500">{{ isLoading ? 'Loading image...' : 'No image available' }}</p>
          </div>
        </div>

        <!-- Enhanced image controls -->
        <div class="flex justify-between">
          <button @click="triggerFileInput" class="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-300 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {{ dealImage ? 'Replace Image' : 'Upload Image' }}
          </button>
          <button v-if="dealImage" @click="removeImage" class="text-red-600 hover:text-red-800 font-medium transition-colors duration-300 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Remove Image
          </button>
        </div>

        <!-- Rest of the form with enhanced styling -->
        <form @submit.prevent="submitDeal" class="space-y-6">
          <!-- Title Field -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
              Deal Title
              <span class="text-gray-500 font-normal ml-1">
                ({{ dealDetails.title.length }}/100)
              </span>
            </label>
            <input 
              type="text" 
              id="title" 
              v-model="dealDetails.title" 
              class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{'border-red-200 bg-red-50': !isTitleValid && dealDetails.title.length > 0}"
              required
              maxlength="100"
              placeholder="Enter a catchy title for your deal"
            >
          </div>

          <!-- Description Field -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span class="text-gray-500 font-normal ml-1">
                ({{ dealDetails.description.length }}/1000)
              </span>
            </label>
            <textarea 
              id="description" 
              v-model="dealDetails.description" 
              rows="4"
              class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{'border-red-200 bg-red-50': !isDescriptionValid && dealDetails.description.length > 0}"
              required
              maxlength="1000"
              placeholder="Describe the deal and why it's worth sharing"
            ></textarea>
          </div>

          <!-- Price Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Current Price -->
            <div>
              <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
                Deal Price
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" 
                  id="price" 
                  v-model="dealDetails.price" 
                  class="w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
              </div>
            </div>

            <!-- List Price -->
            <div>
              <label for="listPrice" class="block text-sm font-medium text-gray-700 mb-1">
                Original Price
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" 
                  id="listPrice" 
                  v-model="dealDetails.listPrice" 
                  class="w-full pl-8 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
              </div>
            </div>
          </div>

          <!-- Category Field -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select 
              id="category" 
              v-model="dealDetails.category"
              class="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="!isTitleValid || !isDescriptionValid || isLoading"
            class="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Submitting...
            </span>
            <span v-else>Submit for Review</span>
          </button>

          <!-- Enhanced info message -->
          <p class="text-sm text-gray-500 text-center bg-gray-50 p-3 rounded-xl">
            ℹ️ Your deal will be reviewed by an admin before it's published.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue'
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
  price: '',
  listPrice: '',
  category: ''
})

const toast = useToastification()
const dealsStore = useDealsStore()
const config = useRuntimeConfig()

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://saversonic.com'
}

// Add these new refs near the top with other refs
const progressValue = ref(0)
const progressInterval = ref(null)

// Add these new functions
const startFakeProgress = () => {
  progressValue.value = 0
  progressInterval.value = setInterval(() => {
    if (progressValue.value < 90) {
      progressValue.value += Math.random() * 15
    }
  }, 500)
}

const stopFakeProgress = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  progressValue.value = 100
  // Reset after animation
  setTimeout(() => {
    progressValue.value = 0
  }, 500)
}

// Modify the fetchDealInfo function
const fetchDealInfo = async () => {
  isLoading.value = true
  startFakeProgress()
  try {
    const response = await api.post('/deals/fetch-image', { url: dealLink.value })
    const imageBaseUrl = getImageBaseUrl()
    dealImage.value = `${imageBaseUrl}${response.data.data.imageUrl}`
    stopFakeProgress()
    toast.success('Deal information fetched successfully')
    step.value = 2
  } catch (error) {
    console.error('Error fetching deal image:', error)
    stopFakeProgress()
    toast.error('Failed to fetch deal image. You can upload an image manually.')
    dealImage.value = ''
    step.value = 2
  } finally {
    isLoading.value = false
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
  if (!isTitleValid.value || !isDescriptionValid.value) {
    toast.error('Please check the title and description fields')
    return
  }

  isLoading.value = true
  try {
    const imageBaseUrl = getImageBaseUrl()
    const dealData = {
      title: dealDetails.title.trim(),
      description: dealDetails.description.trim(),
      price: parseFloat(dealDetails.price),
      listPrice: parseFloat(dealDetails.listPrice),
      category: dealDetails.category.trim(),
      imageUrl: dealImage.value ? dealImage.value.replace(imageBaseUrl, '') : '',
      url: dealLink.value.trim()
    }

    console.log('Submitting deal data:', dealData)

    // Validate all required fields
    const requiredFields = ['title', 'description', 'price', 'listPrice', 'category', 'url', 'imageUrl']
    for (const field of requiredFields) {
      if (!dealData[field] && dealData[field] !== 0) {
        throw new Error(`${field} is required`)
      }
    }

    // Validate numeric fields
    const numericFields = ['price', 'listPrice']
    for (const field of numericFields) {
      if (isNaN(dealData[field])) {
        throw new Error(`${field} must be a valid number`)
      }
    }

    const response = await api.post('/deals', dealData)
    const newDeal = response.data.data.deal
    console.log('New deal from API:', newDeal)
    dealsStore.handleNewDeal(newDeal)
    emit('close')
    toast.success('Deal submitted for review!')
  } catch (error) {
    console.error('Error submitting deal:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
    }
    let errorMessage = error.message || 'Failed to submit deal. Please try again.'
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message
    }
    toast.error(errorMessage)
  } finally {
    isLoading.value = false
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
  if (newValue) {
    step.value = 1
    dealLink.value = ''
    dealImage.value = ''
    Object.assign(dealDetails, { title: '', description: '', price: '', category: '' })
  }
})

// Add computed properties for character count validation
const isTitleValid = computed(() => dealDetails.title.length > 0 && dealDetails.title.length <= 100)
const isDescriptionValid = computed(() => dealDetails.description.length > 0 && dealDetails.description.length <= 1000)

const categories = ref([])
const fetchCategories = async () => {
  try {
    const response = await api.get('/deals/categories')
    console.log('Categories response:', response.data) // Add this line
    categories.value = response.data.data.categories
    console.log('Categories after assignment:', categories.value) // Add this line
  } catch (error) {
    console.error('Error fetching categories:', error)
    toast.error('Failed to load categories')
  }
}

onMounted(async () => {
  console.log('Component mounted') // Add this line
  await fetchCategories()
  console.log('Categories after fetching:', categories.value) // Add this line
})
</script>

<style scoped>
.btn-primary {
  @apply bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-all duration-300 shadow-md hover:shadow-lg;
}

.max-w-full {
  max-width: 100%;
}
.max-h-full {
  max-height: 100%;
}
.fixed {
  z-index: 1000;
}

/* Add this to your existing styles */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>


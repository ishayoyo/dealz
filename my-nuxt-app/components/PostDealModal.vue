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
        <p class="text-center text-gray-600 mb-6">
          Enter the link to the deal you want to share
        </p>
        <form @submit.prevent="fetchDealInfo" class="space-y-4">
          <div>
            <label for="dealLink" class="block text-gray-700 text-sm font-bold mb-2">Deal Link</label>
            <input type="url" id="dealLink" v-model="dealLink" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
          </div>
          <button type="submit" :disabled="isLoading" class="w-full btn btn-primary relative">
            <span v-if="!isLoading">Next</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching image...
            </span>
          </button>
        </form>
        <p v-if="isLoading" class="text-center text-gray-600 mt-4">
          Please wait while we fetch the image. This may take a few moments...
        </p>
      </div>

      <!-- Step 2: Complete deal details -->
      <div v-else class="space-y-6">
        <div class="w-full h-64 flex items-center justify-center mb-2 overflow-hidden bg-gray-100 rounded-lg">
          <img v-if="dealImage" :src="dealImage" alt="Deal Image" class="max-w-full max-h-full object-contain">
          <span v-else-if="isLoading" class="text-gray-500">Loading image...</span>
          <span v-else class="text-gray-500">No image available</span>
        </div>
        <div class="flex justify-between">
          <button @click="triggerFileInput" class="text-primary-600 hover:text-primary-800 text-sm sm:text-base transition-colors duration-300">
            {{ dealImage ? 'Replace Image' : 'Upload Image' }}
          </button>
          <button v-if="dealImage" @click="removeImage" class="text-red-600 hover:text-red-800 text-sm sm:text-base transition-colors duration-300">
            Remove Image
          </button>
        </div>
        <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*">

        <form @submit.prevent="submitDeal" class="space-y-4">
          <div>
            <label for="title" class="block text-gray-700 text-sm font-bold mb-2">
              Deal Title
              <span class="text-gray-500 font-normal">
                ({{ dealDetails.title.length }}/100)
              </span>
            </label>
            <input 
              type="text" 
              id="title" 
              v-model="dealDetails.title" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
              required
              maxlength="100"
            >
          </div>
          
          <div>
            <label for="description" class="block text-gray-700 text-sm font-bold mb-2">
              Description
              <span class="text-gray-500 font-normal">
                ({{ dealDetails.description.length }}/1000)
              </span>
            </label>
            <textarea 
              id="description" 
              v-model="dealDetails.description" 
              rows="3" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" 
              required
              maxlength="1000"
            ></textarea>
          </div>
          
          <div>
            <label for="listPrice" class="block text-gray-700 text-sm font-bold mb-2">List Price ($)</label>
            <input type="number" id="listPrice" v-model="dealDetails.listPrice" step="0.01" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
          </div>
          
          <div>
            <label for="price" class="block text-gray-700 text-sm font-bold mb-2">Deal Price ($)</label>
            <input type="number" id="price" v-model="dealDetails.price" step="0.01" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" required>
          </div>
          
          <div>
            <label for="category" class="block text-gray-700 text-sm font-bold mb-2">Category</label>
            <select 
              id="category" 
              v-model="dealDetails.category" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          
          <button type="submit" class="w-full btn btn-primary">
            {{ isLoading ? 'Submitting...' : 'Submit for Review' }}
          </button>
        </form>
        <p class="text-sm text-gray-500 text-center">Your deal will be reviewed by an admin before it's published.</p>
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

const fetchDealInfo = async () => {
  isLoading.value = true
  try {
    const response = await api.post('/deals/fetch-image', { url: dealLink.value })
    const imageBaseUrl = getImageBaseUrl()
    dealImage.value = `${imageBaseUrl}${response.data.data.imageUrl}`
    toast.success('Deal information fetched successfully')
    step.value = 2 // Advance to the next step
  } catch (error) {
    console.error('Error fetching deal image:', error)
    toast.error('Failed to fetch deal image. You can upload an image manually.')
    dealImage.value = '' // Reset the dealImage if fetch fails
    step.value = 2 // Still advance to the next step even if image fetch fails
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
</style>

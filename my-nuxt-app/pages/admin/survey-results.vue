<template>
  <div class="admin-dashboard p-6 space-y-8 max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-heading text-primary-800">Survey Results</h1>
      <button @click="router.push('/admin/dashboard')" class="btn btn-secondary">
        <i class="fas fa-arrow-left mr-2"></i>
        Back to Dashboard
      </button>
    </div>

    <!-- Survey Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-gradient-to-br from-primary-100 to-primary-200 p-6 rounded-xl shadow-md">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-heading text-gray-800">Total Responses</h3>
          <i class="fas fa-poll text-primary-500 text-2xl"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ totalResponses }}</p>
      </div>
      
      <div class="bg-gradient-to-br from-secondary-100 to-secondary-200 p-6 rounded-xl shadow-md">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-heading text-gray-800">Average Rating</h3>
          <i class="fas fa-star text-secondary-500 text-2xl"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ averageRating.toFixed(1) }}/5</p>
      </div>
      
      <div class="bg-gradient-to-br from-accent-100 to-accent-200 p-6 rounded-xl shadow-md">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-heading text-gray-800">Response Rate</h3>
          <i class="fas fa-chart-line text-accent-500 text-2xl"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mt-2">{{ responseRate }}%</p>
      </div>
    </div>

    <!-- Survey Results Component -->
    <SurveyResults />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '~/services/api'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

const totalResponses = ref(0)
const averageRating = ref(0)
const responseRate = ref(0)

const fetchSurveyMetrics = async () => {
  try {
    const response = await api.get('/survey/metrics')
    totalResponses.value = response.data.totalResponses
    averageRating.value = response.data.averageRating
    responseRate.value = response.data.responseRate
  } catch (error) {
    console.error('Error fetching survey metrics:', error)
    toast.error('Failed to fetch survey metrics')
  }
}

onMounted(async () => {
  await fetchSurveyMetrics()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}
</style> 
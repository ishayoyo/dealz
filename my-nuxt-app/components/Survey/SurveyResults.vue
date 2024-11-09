<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="deal-card p-8">
      <h2 class="text-2xl mb-6 text-center">Survey Results</h2>

      <!-- Rating Questions Results -->
      <div class="grid gap-8 mb-12">
        <div v-for="(data, question) in ratingAnalytics" :key="question" class="bg-white rounded-lg p-6 shadow-md">
          <h3 class="text-lg mb-4 font-semibold">{{ getQuestionText(question) }}</h3>
          
          <!-- Rating Distribution -->
          <div class="space-y-3">
            <div v-for="rating in 5" :key="rating" class="flex items-center gap-4">
              <span class="w-8 text-center">{{ rating }}</span>
              <div class="flex-grow bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  :style="{ width: `${getPercentage(data.ratings[rating] || 0, data.total)}%` }"
                ></div>
              </div>
              <span class="w-16 text-right text-gray-600">
                {{ getPercentage(data.ratings[rating] || 0, data.total) }}%
              </span>
            </div>
          </div>

          <div class="mt-4 flex justify-between text-sm text-gray-600">
            <span>Average: {{ data.average.toFixed(1) }}</span>
            <span>Total Responses: {{ data.total }}</span>
          </div>
        </div>
      </div>

      <!-- Feature Usage Results -->
      <div class="mb-12">
        <h3 class="text-xl mb-6">Most Used Features</h3>
        <div class="grid gap-4">
          <div v-for="(count, feature) in featureUsage" :key="feature" 
               class="bg-white rounded-lg p-4 shadow-md">
            <div class="flex justify-between items-center">
              <span>{{ feature }}</span>
              <div class="flex items-center gap-3">
                <div class="w-32 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    :style="{ width: `${getPercentage(count, totalResponses)}%` }"
                  ></div>
                </div>
                <span class="text-gray-600 w-16 text-right">
                  {{ getPercentage(count, totalResponses) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Feedback -->
      <div>
        <h3 class="text-xl mb-6">Recent Feedback</h3>
        <div class="space-y-4">
          <div v-for="feedback in recentFeedback" :key="feedback._id"
               class="bg-white rounded-lg p-4 shadow-md">
            <p class="text-gray-700">{{ feedback.additionalFeedback }}</p>
            <div class="mt-2 text-sm text-gray-500">
              {{ new Date(feedback.createdAt).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '~/services/api'
import { useToastification } from '~/composables/useToastification'

const toast = useToastification()
const ratingAnalytics = ref({})
const featureUsage = ref({})
const recentFeedback = ref([])
const totalResponses = ref(0)

const getQuestionText = (key) => {
  const questions = {
    userExperience: "Overall Experience Rating",
    dealQuality: "Deal Quality Rating",
    usability: "Ease of Use Rating"
  }
  return questions[key] || key
}

const getPercentage = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

onMounted(async () => {
  try {
    const { data } = await api.get('/survey/analytics')
    
    // Process the analytics data
    ratingAnalytics.value = data.ratingAnalytics
    featureUsage.value = data.featureUsage
    recentFeedback.value = data.recentFeedback
    totalResponses.value = data.totalResponses
  } catch (error) {
    console.error('Error fetching survey results:', error)
    toast.error('Failed to fetch survey results')
  }
})
</script> 
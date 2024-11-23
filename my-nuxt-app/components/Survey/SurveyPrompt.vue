<template>
  <div v-if="!hasSurveyCompleted">
    <!-- Enhanced Survey Button with Pulse Effect -->
    <button 
      @click="isPromptOpen = !isPromptOpen"
      class="fixed left-4 bottom-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 group"
      :class="{ 'rotate-45': isPromptOpen }"
    >
      <i class="fas fa-poll text-xl relative">
        <span class="absolute -top-1 -right-1 flex h-3 w-3" v-if="!hasSeenPrompt">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
        </span>
      </i>
    </button>

    <!-- Enhanced Sliding Prompt Panel -->
    <Transition
      enter-active-class="transform transition ease-out duration-500"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition ease-in duration-300"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div 
        v-if="isPromptOpen"
        class="fixed left-4 bottom-20 w-[340px] bg-white rounded-2xl shadow-2xl z-40 overflow-hidden border border-gray-100"
      >
        <!-- Header with gradient background -->
        <div class="bg-gradient-to-r from-primary-500 to-primary-600 p-6">
          <h3 class="font-heading text-2xl font-bold text-white mb-2">
            Your Voice Matters! 🎯
          </h3>
          <p class="font-body text-white/90 leading-snug">
            Help shape the future of SaverSonic
          </p>
        </div>

        <!-- Content -->
        <div class="p-6 bg-white space-y-5">
          <p class="font-body text-gray-700 leading-relaxed">
            Take our quick survey to help us create the best deal-finding experience for our community.
          </p>

          <!-- Action buttons -->
          <div class="flex gap-3 pt-2">
            <button 
              @click="navigateToSurvey"
              class="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              Start Survey
            </button>
            <button 
              @click="dismissPrompt"
              class="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors duration-300 font-medium"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useLocalStorage } from '@vueuse/core'
import api from '~/services/api'

const router = useRouter()
const toast = useToast()
const isPromptOpen = ref(false)
const hasSeenPrompt = useLocalStorage('hasSeenSurveyPrompt', false)
const hasSurveyCompleted = ref(false)

// Add this function to check survey status
const checkSurveyStatus = async () => {
  try {
    const { data } = await api.get('/survey/status')
    hasSurveyCompleted.value = data.survey.completed
    return data.survey.completed
  } catch (error) {
    console.error('Error checking survey status:', error)
    return false
  }
}

// Update the onMounted hook
onMounted(async () => {
  const completed = await checkSurveyStatus()
  
  // Only show prompt if survey is not completed
  if (!completed) {
    const reminderTime = localStorage.getItem('surveyReminder')
    if (reminderTime) {
      // Check if reminder time has passed
      if (new Date(reminderTime) <= new Date()) {
        setTimeout(() => {
          isPromptOpen.value = true
        }, 2000)
      }
    } else {
      // Show for first time users
      setTimeout(() => {
        isPromptOpen.value = true
      }, 2000)
    }
  }
})

// Update navigateToSurvey function
const navigateToSurvey = async () => {
  try {
    const completed = await checkSurveyStatus()
    if (completed) {
      toast.info('You have already completed the survey. Thank you!')
      isPromptOpen.value = false
      return
    }
    
    hasSeenPrompt.value = true
    isPromptOpen.value = false
    router.push('/survey')
  } catch (error) {
    console.error('Error checking survey status:', error)
    toast.error('Something went wrong. Please try again.')
  }
}

const dismissPrompt = () => {
  isPromptOpen.value = false
  hasSeenPrompt.value = true
  // Set a reminder for 24 hours later
  localStorage.setItem('surveyReminder', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
}
</script>

<style scoped>
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

/* Add smooth transition for button rotation */
button {
  transition: all 0.3s ease;
}

/* Gradient animation */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
}

/* Add font classes if not globally available */
.font-heading {
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.font-body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
</style> 
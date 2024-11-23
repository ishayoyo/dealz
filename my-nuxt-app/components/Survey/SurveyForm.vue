<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="deal-card p-8">
      <h2 class="text-2xl mb-6 text-center">Help Us Improve SaverSonic</h2>
      
      <!-- Rating Questions -->
      <div v-for="(question, key) in ratingQuestions" :key="`rating-${key}`" class="mb-8">
        <h3 class="text-lg mb-3">{{ question.question }}</h3>
        <div class="flex justify-center gap-4">
          <button
            v-for="rating in 5"
            :key="rating"
            @click="setRating(key, rating)"
            :class="[
              'btn-sm rounded-full w-12 h-12 flex items-center justify-center transition-all',
              responses[key] === rating
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white border-2 border-indigo-200 hover:border-indigo-400'
            ]"
          >
            {{ rating }}
          </button>
        </div>
      </div>

      <!-- Feature Usage Question -->
      <div class="mb-8">
        <h3 class="text-lg mb-3">{{ featureQuestion.question }}</h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="option in featureQuestion.options"
            :key="option"
            @click="toggleFeature(option)"
            :class="[
              'btn-sm text-left',
              selectedFeatures.includes(option)
                ? 'btn-primary'
                : 'btn-secondary'
            ]"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Improvements Question -->
      <div class="mb-8">
        <h3 class="text-lg mb-3">{{ improvementsQuestion.question }}</h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="option in improvementsQuestion.options"
            :key="option"
            @click="toggleImprovement(option)"
            :class="[
              'btn-sm text-left',
              selectedImprovements.includes(option)
                ? 'btn-accent'
                : 'btn-secondary'
            ]"
          >
            {{ option }}
          </button>
        </div>
      </div>

      <!-- Additional Feedback -->
      <div class="mb-8">
        <h3 class="text-lg mb-3">Additional Feedback</h3>
        <textarea
          v-model="additionalFeedback"
          class="input-field h-32 resize-none"
          placeholder="Share your thoughts with us..."
        ></textarea>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-center">
        <button
          @click="submitSurvey"
          class="btn btn-primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Survey' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useToastification } from '~/composables/useToastification'
import api from '~/services/api'

const toast = useToastification()
const isSubmitting = ref(false)

const ratingQuestions = {
  userExperience: {
    question: "How would you rate your overall experience with SaverSonic?",
    type: "rating"
  },
  dealQuality: {
    question: "How satisfied are you with the quality of deals?",
    type: "rating"
  },
  usability: {
    question: "How easy is it to find and share deals?",
    type: "rating"
  }
}

const featureQuestion = {
  question: "Which features do you use most often?",
  options: ["Deal Sharing", "Deal Following", "User Following", "Comments", "Deal Alerts"]
}

const improvementsQuestion = {
  question: "What areas would you like to see improved?",
  options: ["Deal Quality", "Website Speed", "Mobile Experience", "Search Function", "User Interface"]
}

const responses = reactive({})
const selectedFeatures = ref([])
const selectedImprovements = ref([])
const additionalFeedback = ref('')

const setRating = (key, rating) => {
  responses[key] = rating
}

const toggleFeature = (feature) => {
  const index = selectedFeatures.value.indexOf(feature)
  if (index === -1) {
    selectedFeatures.value.push(feature)
  } else {
    selectedFeatures.value.splice(index, 1)
  }
}

const toggleImprovement = (improvement) => {
  const index = selectedImprovements.value.indexOf(improvement)
  if (index === -1) {
    selectedImprovements.value.push(improvement)
  } else {
    selectedImprovements.value.splice(index, 1)
  }
}

const submitSurvey = async () => {
  if (!validateResponses()) {
    toast.error('Please answer all rating questions')
    return
  }

  isSubmitting.value = true

  try {
    const surveyData = {
      responses: [
        ...Object.entries(responses).map(([question, answer]) => ({
          question,
          answer,
          type: 'rating'
        })),
        {
          question: 'features',
          answer: selectedFeatures.value,
          type: 'multiSelect'
        },
        {
          question: 'improvements',
          answer: selectedImprovements.value,
          type: 'multiSelect'
        }
      ],
      additionalFeedback: additionalFeedback.value,
      platform: 'web'
    }

    const { data } = await api.post('/survey/submit', surveyData)
    
    if (data.status === 'success') {
      await api.post('/survey/complete')
      
      localStorage.removeItem('surveyReminder')
      localStorage.setItem('hasSeenSurveyPrompt', 'true')
      
      toast.success('Thank you for your feedback!')
      navigateTo('/survey/thank-you')
    } else {
      throw new Error(data.message || 'Failed to submit survey')
    }
  } catch (error) {
    console.error('Survey submission error:', error)
    toast.error(error.response?.data?.message || 'Error submitting survey. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const validateResponses = () => {
  return Object.keys(ratingQuestions).every(key => responses[key])
}
</script> 
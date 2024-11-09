<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <SurveyForm @complete="handleComplete" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

const handleComplete = () => {
  localStorage.setItem('surveyCompleted', 'true')
  toast.success('Thank you for your feedback!')
  router.push('/')
}
</script> 
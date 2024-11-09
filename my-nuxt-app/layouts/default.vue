<template>
  <div class="min-h-screen">
    <ClientOnly>
      <!-- Header -->
      <div 
        class="fixed top-0 left-0 right-0 z-[100] bg-white shadow-md"
        :class="{ 'hidden': isDealModalOpen && isMobile }"
      >
        <Header 
          @open-post-deal-modal="openPostDealModal" 
          @open-auth-modal="openAuthModal" 
        />
      </div>
      
      <!-- Main content -->
      <main class="relative z-[1] pt-16 md:pt-20">
        <slot /> <!-- Page content -->
      </main>

      <!-- Survey Prompt -->
      <SurveyPrompt 
        v-if="isAuthenticated && !surveyCompleted && showSurveyPrompt"
        @complete="handleSurveyComplete"
      />

      <!-- Existing Modals -->
      <FloatingActionButton 
        v-if="isAuthenticated"
        :isDealModalOpen="isDealPage"
        @click="handleFabClick"
      />
      
      <PostDealModal 
        v-if="showPostDealModal" 
        :show="showPostDealModal"
        @close="closePostDealModal" 
        @post-deal="handlePostDeal" 
      />
      
      <AuthModal 
        v-if="showAuthModal" 
        :show="showAuthModal"
        @close="closeAuthModal" 
        @login="handleLogin" 
        @signup="handleSignup" 
        :is-login="isLoginMode" 
      />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'
import { useRouter, useRoute } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'
import SurveyPrompt from '~/components/Survey/SurveyPrompt.vue'

// Store setup
const authStore = useAuthStore()
const dealsStore = useDealsStore()
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()
const router = useRouter()
const route = useRoute()

// State
const showPostDealModal = ref(false)
const showAuthModal = ref(false)
const isLoginMode = ref(true)
const { width } = useWindowSize()

// Survey prompt state
const showSurveyPrompt = ref(false)
const surveyCompleted = useLocalStorage('surveyCompleted', false)
const lastSurveyPrompt = useLocalStorage('lastSurveyPrompt', null)

// Computed
const isMobile = computed(() => width.value < 768)
const isDealModalOpen = computed(() => route.path.startsWith('/deals/') && route.params.id)
const isDealPage = computed(() => route.path.startsWith('/deals/'))

// Methods
const openPostDealModal = () => {
  if (isAuthenticated.value) {
    showPostDealModal.value = true
  } else {
    toast.info('Please log in to post a deal.')
    openAuthModal('login')
  }
}

const closePostDealModal = () => {
  showPostDealModal.value = false
}

const openAuthModal = (mode) => {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

const handlePostDeal = async (dealData) => {
  try {
    await dealsStore.postDeal(dealData)
    closePostDealModal()
    toast.success('Deal posted successfully!')
    router.push('/deals') // Or wherever you want to redirect after posting
  } catch (error) {
    console.error('Error posting deal:', error)
    toast.error('Failed to post deal. Please try again.')
  }
}

const handleLogin = async (credentials) => {
  try {
    const success = await authStore.login(credentials.email, credentials.password)
    if (success) {
      closeAuthModal()
      toast.success('Successfully logged in!')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error(error.response?.data?.message || 'Login failed. Please try again.')
  }
}

const handleSignup = async (userData) => {
  try {
    const success = await authStore.signup(userData)
    if (success) {
      closeAuthModal()
      toast.success('Successfully signed up!')
    }
  } catch (error) {
    console.error('Signup error:', error)
    toast.error(error.response?.data?.message || 'Signup failed. Please try again.')
  }
}

const handleFabClick = () => {
  openPostDealModal()
}

// Route protection
watch(() => route.path, async (newPath) => {
  const protectedRoutes = ['/profile', '/post-deal']
  if (protectedRoutes.includes(newPath) && !isAuthenticated.value) {
    toast.info('Please log in to access this page.')
    await router.push('/login')
  }
})

// Check if we should show the survey prompt
const checkSurveyPrompt = () => {
  if (
    isAuthenticated.value && 
    !authStore.user?.survey?.completed &&
    (!lastSurveyPrompt.value || 
      new Date(lastSurveyPrompt.value).getTime() + (24 * 60 * 60 * 1000) < Date.now())
  ) {
    setTimeout(() => {
      showSurveyPrompt.value = true
    }, 30000)
  }
}

// Close survey prompt
const closeSurveyPrompt = () => {
  showSurveyPrompt.value = false
  lastSurveyPrompt.value = new Date().toISOString()
}

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    checkSurveyPrompt()
  }
})

// Add to existing onMounted
onMounted(() => {
  checkSurveyPrompt()
})

const handleSurveyComplete = async () => {
  await authStore.updateSurveyStatus()
  surveyCompleted.value = true
  showSurveyPrompt.value = false
  toast.success('Thank you for your feedback!')
}
</script>

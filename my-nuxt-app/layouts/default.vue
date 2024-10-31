<template>
  <div class="min-h-screen">
    <!-- Show loading state until auth check completes -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <!-- Add a loading spinner here -->
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <ClientOnly v-else>
      <div v-if="error">
        An error occurred: {{ error.message }}
      </div>
      <template v-else>
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
          <slot /> <!-- This will render the page content -->
        </main>

        <!-- Modals -->
        <ClientOnly>
          <FloatingActionButton 
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
      </template>
    </ClientOnly>
  </div>
</template>


<script setup>
import { ref, onBeforeMount, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'
import { useRouter, useRoute } from 'vue-router'
import PostDealModal from '~/components/PostDealModal.vue'
import AuthModal from '~/components/AuthModal.vue'
import { useWindowSize } from '@vueuse/core'

const authStore = useAuthStore()
const dealsStore = useDealsStore()
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()
const router = useRouter()
const route = useRoute()

const showPostDealModal = ref(false)
const showAuthModal = ref(false)
const isLoginMode = ref(true)

// Add isLoading ref
const isLoading = ref(true)

// Modify onBeforeMount
onBeforeMount(async () => {
  console.log('Layout: Checking authentication status')
  isLoading.value = true
  try {
    await nextTick()
    console.log('Layout: Authentication status checked, isAuthenticated:', isAuthenticated.value)
  } catch (error) {
    console.error('Layout: Error checking auth:', error)
  } finally {
    isLoading.value = false
  }
})

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
    } else {
      toast.error('Login failed. Please check your credentials and try again.')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during login')
  }
}

const handleSignup = async (userData) => {
  try {
    const success = await authStore.signup(userData)
    if (success) {
      closeAuthModal()
      toast.success('Successfully signed up!')
    } else {
      toast.error('Signup failed. Please check your information and try again.')
    }
  } catch (error) {
    console.error('Signup error:', error)
    toast.error(error.response?.data?.message || 'An error occurred during signup')
  }
}

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('Layout caught an error:', err)
  error.value = err
  return false // prevent error from propagating further
})

// Watch for route changes to protect certain routes
watch(() => route.path, async (newPath) => {
  console.log('Layout: Route changed to', newPath)
  const protectedRoutes = ['/profile', '/post-deal'] // Add your protected routes here
  if (protectedRoutes.includes(newPath) && !isAuthenticated.value) {
    console.log('Layout: Attempting to access protected route while not authenticated')
    toast.info('Please log in to access this page.')
    await router.push('/login')
  }
})

// Add these to your existing script
const { width } = useWindowSize()

// Add these computed properties
const isMobile = computed(() => width.value < 768)
const isDealModalOpen = computed(() => {
  return route.path.startsWith('/deals/') && route.params.id
})

// Check if we're on a deal page
const isDealPage = computed(() => {
  return route.path.startsWith('/deals/')
})

const handleFabClick = () => {
  // Call the same function as the header button
  openPostDealModal()
}

// ... rest of your existing script
</script>

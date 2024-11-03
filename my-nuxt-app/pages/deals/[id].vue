<template>
  <div class="relative min-h-screen">
    <Transition name="fade" appear>
      <div 
        v-if="loading" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-white"
      >
        <div class="loader"></div>
      </div>
      
      <div 
        v-else-if="error" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-white"
      >
        <div class="text-center py-8 text-red-500 animate-fade-in">
          {{ error }}
          <button 
            @click="retryFetch" 
            class="mt-4 text-primary-600 hover:text-primary-700"
          >
            Retry
          </button>
        </div>
      </div>

      <div v-else-if="deal" class="min-h-screen">
        <DealModal 
          v-model:deal="deal"
          :isOpen="true"
          :isDedicatedPage="true"
          :isAuthenticated="isAuthenticated"
          @close-modal="goBack"
          @open-auth-modal="openAuthModal"
        />
      </div>
    </Transition>

    <AuthModal 
      v-if="showAuthModal"
      :show="showAuthModal"
      @close="closeAuthModal"
      :is-login="isLoginMode"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDealsStore } from '~/stores/deals'
import { useAuthStore } from '~/stores/auth'
import { useWindowSize } from '@vueuse/core'
import AuthModal from '~/components/AuthModal.vue'

const route = useRoute()
const router = useRouter()
const dealsStore = useDealsStore()
const authStore = useAuthStore()
const { width } = useWindowSize()

const deal = ref(null)
const loading = ref(true)
const error = ref(null)

const isMobile = computed(() => width.value < 768)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const showAuthModal = ref(false)
const isLoginMode = ref(true)

const openAuthModal = (mode) => {
  isLoginMode.value = mode === 'login'
  showAuthModal.value = true
}

const closeAuthModal = () => {
  showAuthModal.value = false
}

async function fetchDeal() {
  loading.value = true
  error.value = null
  try {
    console.log('Fetching deal with ID:', route.params.id)
    const response = await dealsStore.fetchDealById(route.params.id)
    console.log('Deal response:', response)
    
    if (response?.data?.deal) {
      deal.value = response.data.deal
    } else {
      error.value = 'Deal not found'
    }
  } catch (err) {
    console.error('Error fetching deal:', err)
    error.value = 'Failed to load deal'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchDeal()
})

const goBack = () => {
  if (window.history.length > 2) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

const retryFetch = async () => {
  error.value = null
  await fetchDeal()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #f3f3f3;
  border-radius: 50%;
  border-top: 5px solid #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

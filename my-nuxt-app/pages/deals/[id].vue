<template>
  <div class="relative">
    <div 
      class="container mx-auto px-4 py-8"
      :class="{ 'pt-24': !deal || !isMobile }"
    >
      <Transition 
        name="fade-up" 
        mode="out-in"
        appear
      >
        <div key="content" class="relative">
          <DealModalSkeleton 
            v-if="loading" 
            class="animate-shimmer"
          />
          <div 
            v-else-if="error" 
            class="text-center py-8 text-red-500 animate-fade-in"
          >
            {{ error }}
            <button 
              @click="retryFetch" 
              class="mt-4 text-primary-600 hover:text-primary-700"
            >
              Retry
            </button>
          </div>
          <DealModal 
            v-else-if="deal" 
            v-model:deal="deal"
            :isOpen="true"
            :isDedicatedPage="true"
            @close-modal="goBack"
            @open-auth-modal="openAuthModal"
          />
        </div>
      </Transition>
    </div>
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
import { useWindowSize } from '@vueuse/core'
import AuthModal from '~/components/AuthModal.vue'

const route = useRoute()
const router = useRouter()
const dealsStore = useDealsStore()
const { width } = useWindowSize()

const deal = ref(null)
const loading = ref(true)
const error = ref(null)

const isMobile = computed(() => width.value < 768)

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
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-size: 2000px 100%;
  animation: shimmer 2s infinite linear;
}
</style>

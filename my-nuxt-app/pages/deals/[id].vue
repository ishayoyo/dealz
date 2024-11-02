<template>
  <div class="relative">
    <div 
      class="container mx-auto px-4 py-8"
      :class="{ 'pt-24': !deal || !isMobile }"
    >
      <Transition name="fade" mode="out-in">
        <div key="content">
          <DealModalSkeleton v-if="loading" />
          <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
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
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

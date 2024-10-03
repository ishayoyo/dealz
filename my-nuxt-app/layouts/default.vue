<template>
  <div>
    <div v-if="error">
      An error occurred: {{ error.message }}
    </div>
    <template v-else>
      <Header @open-post-deal-modal="openPostDealModal" />
      <main class="pt-16 md:pt-20"> <!-- Adjusted padding-top to match new header height -->
        <slot />
      </main>
      <ClientOnly>
        <FloatingActionButton v-if="isAuthenticated" @click="openPostDealModal" />
        <PostDealModal v-if="showPostDealModal" @close="closePostDealModal" @post-deal="handlePostDeal" />
      </ClientOnly>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const dealsStore = useDealsStore()
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()
const router = useRouter()
const route = useRoute()

const showPostDealModal = ref(false)

const openPostDealModal = () => {
  if (isAuthenticated.value) {
    showPostDealModal.value = true
  } else {
    toast.info('Please log in to post a deal.')
    router.push('/login')
  }
}

const closePostDealModal = () => {
  showPostDealModal.value = false
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

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('Layout caught an error:', err)
  error.value = err
  return false // prevent error from propagating further
})

// Check authentication status on mount
onMounted(async () => {
  if (!isAuthenticated.value) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }
})

// Watch for route changes to protect certain routes
watch(() => route.path, async (newPath) => {
  const protectedRoutes = ['/profile', '/post-deal'] // Add your protected routes here
  if (protectedRoutes.includes(newPath) && !isAuthenticated.value) {
    toast.info('Please log in to access this page.')
    await router.push('/login')
  }
})
</script>
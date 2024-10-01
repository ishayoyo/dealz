<template>
  <div>
    <Header @open-post-deal-modal="openPostDealModal" />
    <main class="pt-16 md:pt-20"> <!-- Adjusted padding-top to match new header height -->
      <slot />
    </main>
    <ClientOnly>
      <FloatingActionButton v-if="isAuthenticated" @click="openPostDealModal" />
      <PostDealModal v-if="showPostDealModal" @close="closePostDealModal" @post-deal="handlePostDeal" />
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'

const authStore = useAuthStore()
const dealsStore = useDealsStore()
const { isAuthenticated } = storeToRefs(authStore)
const toast = useToastification()

const showPostDealModal = ref(false)

const openPostDealModal = () => {
  showPostDealModal.value = true
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
</script>
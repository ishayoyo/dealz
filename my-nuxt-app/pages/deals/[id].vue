<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <DealModal 
      v-if="deal" 
      :deal="deal" 
      :isOpen="true"
      @close-modal="goBack"
    />
    <div v-else-if="loading" class="text-center py-8">Loading deal...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDealsStore } from '~/stores/deals'
import DealModal from '~/components/DealModal.vue'

const route = useRoute()
const router = useRouter()
const dealsStore = useDealsStore()

const deal = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  await fetchDeal()
})

async function fetchDeal() {
  loading.value = true
  error.value = null
  try {
    deal.value = dealsStore.getDealById(route.params.id)
    if (!deal.value) {
      await dealsStore.fetchDeals()
      deal.value = dealsStore.getDealById(route.params.id)
    }
    if (!deal.value) {
      throw new Error('Deal not found')
    }
  } catch (err) {
    console.error('Error fetching deal:', err)
    error.value = 'Failed to load deal'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>
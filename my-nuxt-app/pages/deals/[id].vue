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
import api from '~/services/api'
import DealModal from '~/components/DealModal.vue'

const route = useRoute()
const router = useRouter()

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
    const response = await api.get(`/deals/${route.params.id}`)
    deal.value = response.data.data.deal
  } catch (err) {
    console.error('Error fetching deal:', err)
    if (err.response && err.response.status === 403) {
      error.value = 'This deal is not available or pending approval.'
    } else {
      error.value = 'Failed to load deal'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>
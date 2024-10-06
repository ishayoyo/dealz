<template>
    <div v-if="isLoading" class="container mx-auto px-4 py-8">
      Loading...
    </div>
    <div v-else-if="error" class="container mx-auto px-4 py-8">
      {{ error }}
    </div>
    <div v-else-if="profile" class="container mx-auto px-4 py-8">
      <div class="flex items-center mb-6">
        <UserAvatar :name="profile.username" :src="profile.profilePicture" :size="80" class="mr-4" />
        <h1 class="text-3xl font-bold">{{ profile.username || 'User' }}'s Profile</h1>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="md:col-span-1">
          <div class="bg-white p-4 rounded-lg shadow">
            <div class="flex justify-between mb-4">
              <div>
                <p class="text-gray-600">Followers</p>
                <p class="text-2xl font-bold">{{ profile.followerCount || 0 }}</p>
              </div>
              <div>
                <p class="text-gray-600">Following</p>
                <p class="text-2xl font-bold">{{ profile.followingCount || 0 }}</p>
              </div>
            </div>
            <!-- Add more user details here if needed -->
          </div>
        </div>
        <div class="md:col-span-2">
          <h2 class="text-2xl font-semibold mb-4">Recent Deals</h2>
          <div v-if="deals && deals.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DealCard 
              v-for="deal in deals" 
              :key="deal['_id']" 
              :deal="deal" 
              @click="openDealModal(deal)" 
            />
          </div>
          <p v-else>No deals posted yet.</p>
        </div>
      </div>
    </div>
</template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToastification } from '~/composables/useToastification'
  import { useAuthStore } from '~/stores/auth'
  import DealCard from '~/components/DealCard.vue'
  import api from '~/services/api'

  const route = useRoute()
  const router = useRouter()
  const toast = useToastification()
  const authStore = useAuthStore()
  const profile = ref(null)
  const deals = ref([])
  const error = ref(null)
  const isLoading = ref(true)

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const response = await api.get(`/users/profile/${route.params.id}`)
      console.log('API Response:', JSON.stringify(response.data, null, 2))
      if (response.data && response.data.data) {
        profile.value = response.data.data.user
        deals.value = response.data.data.deals || []
        console.log('Profile value:', JSON.stringify(profile.value, null, 2))
        console.log('Deals:', JSON.stringify(deals.value, null, 2))
      } else {
        console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2))
        error.value = 'Unexpected data format received from server'
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      if (err.response && err.response.status === 401) {
        error.value = 'Please log in to view this profile'
        authStore.logout()
      } else {
        error.value = 'Failed to load user profile'
      }
      toast.error(error.value)
    } finally {
      isLoading.value = false
    }
  }
  
  const openDealModal = (deal) => {
    console.log('Opening deal modal:', deal)
    router.push(`/deals/${deal['_id']}`)
  }
  
  onMounted(() => {
    fetchProfile()
  })
  </script>
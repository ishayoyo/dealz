<template>
    <div class="bg-gray-100 min-h-screen">
        <div v-if="isLoading" class="flex justify-center items-center h-screen">
          <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-600"></div>
        </div>
        <div v-else-if="error" class="container mx-auto px-4 py-8 text-center text-red-500">
          {{ error }}
        </div>
        <div v-else-if="profile" class="container mx-auto px-4 py-8">
          <!-- Profile Header -->
          <div class="bg-white shadow rounded-lg p-6 mb-6">
            <div class="flex flex-col sm:flex-row items-center">
              <UserAvatar :name="profile.username" :src="profile.profilePicture" :size="120" class="mb-4 sm:mb-0 sm:mr-6" />
              <div class="text-center sm:text-left">
                <h1 class="text-2xl font-bold text-gray-800">{{ profile.username }}</h1>
                <!-- Only show bio if it exists -->
                <p v-if="profile.bio" class="text-gray-600 mt-2">{{ profile.bio }}</p>
                <div class="flex justify-center sm:justify-start mt-4 space-x-4">
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-gray-700">{{ profile.followerCount || 0 }}</span>
                    <span class="text-gray-600">Followers</span>
                  </div>
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-gray-700">{{ profile.followingCount || 0 }}</span>
                    <span class="text-gray-600">Following</span>
                  </div>
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-gray-700">{{ deals.length }}</span>
                    <span class="text-gray-600">Deals</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-center sm:justify-start">
              <button 
                v-if="authStore.isAuthenticated && profile.id !== authStore.user?.id"
                @click="handleFollowUser" 
                class="bg-primary-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-primary-700 transition duration-300"
              >
                {{ isFollowing ? 'Unfollow' : 'Follow' }}
              </button>
            </div>
          </div>

          <!-- Deals Grid -->
          <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Recent Deals</h2>
            <div v-if="deals && deals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DealCard 
                v-for="deal in deals" 
                :key="deal['_id']" 
                :deal="deal" 
                @open-modal="openDealModal" 
                class="cursor-pointer transition duration-300 transform hover:scale-105"
              />
            </div>
            <p v-else class="text-center text-gray-500">No deals posted yet.</p>
          </div>
        </div>
    </div>
</template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
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
  const isFollowing = computed(() => {
    return authStore.user && profile.value && authStore.user.following && authStore.user.following.includes(profile.value.id)
  })

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const response = await api.get(`/users/profile/${route.params.id}`)
      if (response.data && response.data.data) {
        profile.value = response.data.data.user
        deals.value = response.data.data.deals || []
      } else {
        error.value = 'Unexpected data format received from server'
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      error.value = err.response?.status === 401 ? 'Please log in to view this profile' : 'Failed to load user profile'
      if (err.response?.status === 401) authStore.logout()
      toast.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const handleFollowUser = async () => {
    if (!authStore.isAuthenticated) {
      toast.info("Please log in to follow users")
      return
    }
    if (!profile.value || !profile.value.id) {
      toast.error("Unable to follow user at this time")
      return
    }
    const result = await authStore.followUser(profile.value.id)
    if (result.success) {
      profile.value.followerCount = result.followerCount !== undefined ? result.followerCount : (profile.value.followerCount + (result.isFollowing ? 1 : -1))
      toast.success(result.isFollowing ? 'User followed successfully' : 'User unfollowed successfully')
    } else {
      toast.error(result.error || 'An error occurred while following/unfollowing the user')
    }
  }

  const openDealModal = (deal) => {
    router.push(`/deals/${deal['_id']}`)
  }

  onMounted(() => {
    fetchProfile()
  })
  </script>
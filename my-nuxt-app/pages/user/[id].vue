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
                <h1 class="text-2xl font-bold text-gray-800">{{ profile.username || 'User' }}</h1>
                <p class="text-gray-600 mt-2">{{ profile.bio || 'No bio available' }}</p>
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
                @click="openDealModal(deal)" 
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
  const isFollowing = ref(false)

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const response = await api.get(`/users/profile/${route.params.id}`)
      console.log('Profile response:', response.data)
      if (response.data && response.data.data) {
        profile.value = response.data.data.user
        // Ensure followerCount is initialized
        profile.value.followerCount = response.data.data.user.followerCount || 0
        deals.value = response.data.data.deals || []
        isFollowing.value = response.data.data.isFollowing || false
        console.log('Profile set:', profile.value)
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
    console.log('handleFollowUser called')
    if (!authStore.isAuthenticated) {
      console.log('User not authenticated')
      toast.info("Please log in to follow users")
      return
    }
    if (!profile.value || !profile.value.id) {
      console.log('Invalid profile:', profile.value)
      toast.error("Unable to follow user at this time")
      return
    }
    try {
      await followUser()
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      if (error.response && error.response.data) {
        if (error.response.data.message === 'You are already following this user') {
          isFollowing.value = true
          toast.info('You are already following this user')
        } else {
          toast.error(`Error: ${error.response.data.message || 'An unexpected error occurred'}`)
        }
      } else {
        toast.error('An error occurred while following/unfollowing the user')
      }
    }
  }

  const followUser = async () => {
    try {
      console.log('Attempting to follow/unfollow user:', profile.value.id)
      const method = isFollowing.value ? 'delete' : 'post'
      const url = `/users/${profile.value.id}/follow`
      console.log(`Sending ${method.toUpperCase()} request to ${url}`)
      
      const response = await api[method](url)
      console.log('Follow/unfollow response:', response.data)
      
      if (response.data && response.data.status === 'success') {
        isFollowing.value = !isFollowing.value
        
        // Update follower count based on the response or local calculation
        if (response.data.data && response.data.data.followerCount !== undefined) {
          profile.value.followerCount = response.data.data.followerCount
        } else {
          // If followerCount is not provided, update it locally
          profile.value.followerCount += isFollowing.value ? 1 : -1
        }
        
        toast.success(isFollowing.value ? 'User followed successfully' : 'User unfollowed successfully')
      } else {
        throw new Error(response.data.message || 'Unexpected response from server')
      }
    } catch (error) {
      console.error('Error in followUser:', error)
      if (error.response && error.response.data) {
        if (error.response.data.message === 'You are already following this user') {
          // Handle the case where the user is already being followed
          isFollowing.value = true
          toast.info('You are already following this user')
          return // Exit the function without throwing an error
        }
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
        console.error('Error headers:', error.response.headers)
      } else if (error.request) {
        console.error('Error request:', error.request)
      } else {
        console.error('Error message:', error.message)
      }
      throw error
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
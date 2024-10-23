<template>
    <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div v-if="isLoading" class="container mx-auto">
          <UserProfileSkeleton />
          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DealCardSkeleton v-for="i in 6" :key="i" />
          </div>
        </div>
        <div v-else-if="error" class="container mx-auto px-4 py-8 text-center text-accent-600">
          {{ error }}
        </div>
        <div v-else-if="profile" class="container mx-auto">
          <!-- Profile Header -->
          <div class="bg-white shadow-lg rounded-xl p-8 mb-8 animate-float">
            <div class="flex flex-col sm:flex-row items-center">
              <img :src="avatarUrl" :alt="profile.username" class="w-32 h-32 rounded-full mb-4 sm:mb-0 sm:mr-8" />
              <div class="text-center sm:text-left">
                <h1 class="text-3xl font-bold text-primary-800 mb-2">{{ profile.username }}</h1>
                <!-- Only show bio if it exists -->
                <p v-if="profile.bio" class="text-gray-600 mt-2 mb-4">{{ profile.bio }}</p>
                <div class="flex justify-center sm:justify-start space-x-6">
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-primary-600 text-xl">{{ profile.followerCount || 0 }}</span>
                    <span class="text-gray-500">Followers</span>
                  </div>
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-primary-600 text-xl">{{ followingCount }}</span>
                    <span class="text-gray-500">Following</span>
                  </div>
                  <div class="flex flex-col items-center sm:items-start">
                    <span class="font-bold text-primary-600 text-xl">{{ dealsCount }}</span>
                    <span class="text-gray-500">Deals</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-center sm:justify-start">
              <button 
                v-if="authStore.isAuthenticated && profile.id !== authStore.user?.id"
                @click="handleFollowUser" 
                class="btn btn-primary"
              >
                {{ isFollowing ? 'Unfollow' : 'Follow' }}
              </button>
            </div>
          </div>

          <!-- Deals Grid -->
          <div class="bg-white shadow-lg rounded-xl p-8">
            <h2 class="text-2xl font-semibold mb-6 text-primary-800">Recent Deals</h2>
            <div v-if="deals && deals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <DealCard 
                v-for="deal in deals" 
                :key="deal['_id']" 
                :deal="{ ...deal, user: { ...deal.user, avatarUrl: avatarUrl } }"
                :username="profile.username"
                @open-modal="openDealModal" 
                class="deal-card cursor-pointer transition duration-300 transform hover:scale-105"
              />
            </div>
            <p v-else class="text-center text-gray-500 py-8">No deals posted yet.</p>
          </div>
        </div>
    </div>
</template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToastification } from '~/composables/useToastification'
  import { useAuthStore } from '~/stores/auth'
  import DealCard from '~/components/DealCard.vue'
  import api from '~/services/api'
  import UserProfileSkeleton from '~/components/UserProfileSkeleton.vue'
  import DealCardSkeleton from '~/components/DealCardSkeleton.vue'

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
  const avatarUrl = ref('')
  const followingCount = ref(0)
  const dealsCount = ref(0)

  const fetchAvatar = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/avatar`)
      avatarUrl.value = response.data.data.avatarUrl
    } catch (error) {
      console.error('Error fetching avatar:', error)
      // Set a default avatar URL in case of error
      avatarUrl.value = 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
    }
  }

  const fetchProfile = async () => {
    isLoading.value = true
    try {
      const response = await api.get(`/users/profile/${route.params.id}`)
      if (response.data && response.data.data) {
        profile.value = response.data.data.user || {}
        await Promise.all([
          fetchAvatar(profile.value.id),
          fetchFollowersCount(),
          fetchFollowingCount(),
          fetchDealsCount()
        ])
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
      profile.value.followerCount = result.followerCount
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

  // Add this watch to refetch the profile when the route changes
  watch(() => route.params.id, () => {
    fetchProfile()
  })

  // Listen for follower count updates
  const { $socket } = useNuxtApp()
  $socket.on('followerCountUpdate', (data) => {
    if (profile.value && profile.value.id === data.userId) {
      profile.value.followerCount = data.count
    }
  })

  const fetchFollowersCount = async () => {
    try {
      const response = await api.get(`/users/${profile.value.id}/followers`)
      if (response.data && response.data.data) {
        profile.value.followerCount = response.data.data.count || response.data.data.followers.length
      }
    } catch (error) {
      console.error('Error fetching followers count:', error)
    }
  }

  const fetchFollowingCount = async () => {
    try {
      const response = await api.get(`/users/${profile.value.id}/following`)
      followingCount.value = response.data.data.following.length
    } catch (error) {
      console.error('Error fetching following count:', error)
    }
  }

  const fetchDealsCount = async () => {
    try {
      const response = await api.get(`/users/${profile.value.id}/deals`)
      dealsCount.value = response.data.data.deals.length
      deals.value = response.data.data.deals.map(deal => ({
        ...deal,
        user: { 
          username: profile.value.username,
          _id: profile.value.id,
          avatarUrl: avatarUrl.value
        }
      }))
    } catch (error) {
      console.error('Error fetching deals count:', error)
    }
  }

  // Add this function to handle tracking events
  const handleTrackEvent = async (eventData) => {
    console.log('Tracking event:', eventData);
    try {
      const response = await api.post('/marketing/tracking/log', eventData);
      console.log('Tracking event response:', response.data);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Update the DealModal component to include the track-event handler
  // Add a computed property for subid
  const subid = computed(() => {
    if (process.client) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('subid') || 'organic';
    }
    return 'organic';
  });
  </script>


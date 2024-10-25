<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div v-if="loading" class="container mx-auto">
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
          <div class="relative mb-4 sm:mb-0 sm:mr-8">
            <UserAvatar 
              :name="getUserName" 
              :size="128" 
              :seed="profile.avatarSeed || authStore.user?.avatarSeed"
            />
            <button @click="changeAvatar" class="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div class="text-center sm:text-left">
            <h1 class="text-3xl font-bold text-primary-800 mb-2">{{ getUserName }}</h1>
            <p class="text-gray-600">{{ profile.email }}</p>
            <div class="flex justify-center sm:justify-start space-x-6 mt-4">
              <div class="flex flex-col items-center sm:items-start">
                <span class="font-bold text-primary-600 text-xl">{{ profile?.followerCount || 0 }}</span>
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
      </div>

      <!-- Tabs and Content -->
      <div class="bg-white shadow-lg rounded-xl p-8">
        <!-- Desktop Tabs -->
        <div class="hidden md:block border-b border-gray-200 mb-6">
          <nav class="flex">
            <button v-for="tab in tabs" :key="tab.id" @click="selectTab(tab.id)" 
                    :class="['mr-4 py-2 px-1 border-b-2 font-medium text-sm', 
                             currentTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Mobile Menu Toggle -->
        <div class="md:hidden mb-4">
          <button @click="toggleMobileMenu" class="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg flex justify-between items-center">
            <span>{{ getCurrentTabName }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="isMobileMenuOpen" class="md:hidden mb-4">
          <div class="bg-white shadow-md rounded-lg overflow-hidden">
            <button v-for="tab in tabs" :key="tab.id" @click="selectTab(tab.id)" 
                    class="w-full py-2 px-4 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    :class="{ 'bg-gray-100': currentTab === tab.id }">
              {{ tab.name }}
            </button>
          </div>
        </div>

        <!-- Tab content -->
        <div class="mt-6">
          <div v-if="currentTab === 'info'" class="max-w-md mx-auto space-y-4">
            <div v-for="field in userFields" :key="field.key" class="flex flex-col">
              <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
              <input :id="field.key" v-model="profile[field.key]" :type="field.type" class="input-field">
            </div>
            <div>
              <button @click="saveChanges" class="btn btn-primary w-full">Save Changes</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'password'" class="max-w-md mx-auto space-y-4">
            <div v-for="field in passwordFields" :key="field.key" class="flex flex-col">
              <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
              <input :id="field.key" v-model="passwordChange[field.key]" type="password" class="input-field">
            </div>
            <div>
              <button @click="changePassword" class="btn btn-primary w-full">Change Password</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'following'">
            <FollowingList :following="followingUsers" @unfollow="unfollowUser" />
          </div>

          <div v-else-if="currentTab === 'followers'">
            <FollowersList :followers="followers" :followingIds="followingUserIds" @follow="followUser" @unfollow="unfollowUser" />
          </div>

          <div v-else-if="currentTab === 'deals'">
            <h2 class="text-2xl font-semibold mb-6 text-primary-800">My Deals</h2>
            <div v-if="userDeals.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <DealCard 
                v-for="deal in userDeals" 
                :key="deal._id" 
                :deal="deal"
                :username="deal.user.username || getUserName"
                @open-modal="navigateToDeal" 
                class="deal-card cursor-pointer transition duration-300 transform hover:scale-105"
              />
            </div>
            <p v-else class="text-center text-gray-500 py-8">You haven't posted any deals yet.</p>
          </div>

          <div v-else-if="currentTab === 'followedDeals'">
            <h2 class="text-2xl font-semibold mb-6 text-primary-800">Followed Deals</h2>
            <div v-if="followedDeals.length > 0" class="space-y-4">
              <div v-for="deal in followedDeals" :key="deal._id" class="bg-white shadow-md rounded-lg overflow-hidden">
                <div class="flex items-center p-4">
                  <img :src="getFullImageUrl(deal.imageUrl)" :alt="deal.title" class="w-20 h-20 object-cover mr-4 rounded-md">
                  <div class="flex-grow">
                    <h4 class="font-medium text-lg">{{ deal.title }}</h4>
                    <p class="text-sm text-gray-600">${{ deal.price }}</p>
                    <p class="text-xs text-gray-500 mt-1">Posted by: {{ deal.user.username }}</p>
                  </div>
                  <button @click="unfollowDeal(deal._id)" class="btn btn-outline-primary btn-sm">
                    Unfollow
                  </button>
                </div>
              </div>
            </div>
            <p v-else class="text-center text-gray-500 py-8">You're not following any deals yet.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import api from '~/services/api'
import FollowingList from '~/components/FollowingList.vue'
import FollowersList from '~/components/FollowersList.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useToastification } from '~/composables/useToastification'
import { useAuthStore } from '~/stores/auth'
import UserProfileSkeleton from '~/components/UserProfileSkeleton.vue'
import DealCardSkeleton from '~/components/DealCardSkeleton.vue'
import DealCard from '~/components/DealCard.vue'

const config = useRuntimeConfig()
const fileInput = ref(null)
const loading = ref(true)
const error = ref(null)
const profile = ref(null)
const followingUsers = ref([])
const followers = ref([])
const userDeals = ref([])
const followedDeals = ref([])

const currentTab = ref('info')
const tabs = [
  { id: 'info', name: 'Personal Info' },
  { id: 'password', name: 'Change Password' },
  { id: 'following', name: 'Following' },
  { id: 'followers', name: 'Followers' },
  { id: 'deals', name: 'My Deals' },
  { id: 'followedDeals', name: 'Followed Deals' }
]

const followingCount = ref(0)
const dealsCount = ref(0)

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchUserProfile(),
      fetchFollowingCount(),
      fetchDealsCount()
    ])
  } catch (err) {
    error.value = 'Failed to load user data'
    console.error(err)
  } finally {
    loading.value = false
  }
})

const fetchUserProfile = async () => {
  try {
    const response = await api.get('/users/me')
    profile.value = response.data.data.user
    
    // Fetch follower count along with the profile
    const followerResponse = await api.get('/users/me/followers')
    if (followerResponse.data && followerResponse.data.data) {
      profile.value.followerCount = followerResponse.data.data.count || followerResponse.data.data.followers.length
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    toast.error('Failed to fetch user profile')
  }
}

// Add this new function to fetch only the follower count
const fetchFollowersCount = async () => {
  try {
    const response = await api.get('/users/me/followers')
    if (response.data && response.data.data) {
      profile.value.followerCount = response.data.data.count || response.data.data.followers.length
    }
  } catch (error) {
    console.error('Error fetching followers count:', error)
  }
}

const fetchFollowingCount = async () => {
  try {
    const response = await api.get('/users/me/following')
    followingCount.value = response.data.data.following.length
  } catch (error) {
    console.error('Error fetching following count:', error)
  }
}

const fetchDealsCount = async () => {
  try {
    const response = await api.get('/users/me/deals')
    dealsCount.value = response.data.data.deals.length
  } catch (error) {
    console.error('Error fetching deals count:', error)
  }
}

const getUserName = computed(() => {
  if (!profile.value) return ''
  return profile.value.firstName && profile.value.lastName
    ? `${profile.value.firstName} ${profile.value.lastName}`
    : profile.value.username || ''
})

const fullProfilePictureUrl = computed(() => {
  if (!profile.value || !profile.value.profilePicture) return ''
  return profile.value.profilePicture.startsWith('http') 
    ? profile.value.profilePicture 
    : `${config.public.apiBase}${profile.value.profilePicture}`
})

const getFullProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return ''
  return profilePicture.startsWith('http') 
    ? profilePicture 
    : `${config.public.apiBase}${profilePicture}`
}

const fetchFollowedDeals = async () => {
  try {
    const response = await api.get('/users/me/followed-deals')
    followedDeals.value = response.data.data.followedDeals
  } catch (error) {
    console.error('Error fetching followed deals:', error)
    toast.error('Failed to fetch followed deals')
  }
}

const fetchUserDeals = async () => {
  try {
    const response = await api.get('/users/me/deals')
    console.log('Raw deals response:', response.data.data.deals[0]) // Log the first deal to see its structure
    
    userDeals.value = response.data.data.deals.map(deal => {
      // Make sure we're passing all user details
      const mappedDeal = {
        ...deal,
        user: {
          ...deal.user,
          _id: deal.user._id,
          username: deal.user.username,
          avatarUrl: getAvatarUrl(deal.user._id)
        }
      }
      console.log('Mapped deal:', mappedDeal) // Log the mapped deal
      return mappedDeal
    })
  } catch (error) {
    console.error('Error fetching user deals:', error)
    throw error
  }
}

const fetchFollowing = async () => {
  try {
    const response = await api.get('/users/me/following')
    followingUsers.value = response.data.data.following.filter(user => user && user._id).map(user => ({
      _id: user._id,
      username: user.username,
      avatarSeed: user.avatarSeed
    }))
  } catch (error) {
    console.error('Error fetching following users:', error)
    toast.error('Failed to fetch following users')
    followingUsers.value = []
  }
}

const fetchFollowers = async () => {
  try {
    const response = await api.get('/users/me/followers')
    followers.value = response.data.data.followers.filter(follower => follower && follower._id).map(user => ({
      _id: user._id,
      username: user.username,
      avatarSeed: user.avatarSeed,
      isFollowing: followingUserIds.value.includes(user._id)
    }))
  } catch (error) {
    console.error('Error fetching followers:', error)
    toast.error('Failed to fetch followers')
    followers.value = []
  }
}

const followUser = async (userId) => {
  try {
    await api.post(`/users/${userId}/follow`)
    const followedUser = followers.value.find(user => user._id === userId)
    if (followedUser) {
      followedUser.isFollowing = true
    }
    await fetchFollowersCount() // Replace fetchUserProfile with this
    await fetchFollowingCount()
  } catch (error) {
    console.error('Error following user:', error)
    toast.error('Failed to follow user')
  }
}

const unfollowUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}/follow`)
    const unfollowedUser = followers.value.find(user => user._id === userId)
    if (unfollowedUser) {
      unfollowedUser.isFollowing = false
    }
    followingUsers.value = followingUsers.value.filter(user => user._id !== userId)
    await fetchFollowersCount() // Replace fetchUserProfile with this
    await fetchFollowingCount()
  } catch (error) {
    console.error('Error unfollowing user:', error)
    toast.error('Failed to unfollow user')
  }
}

const unfollowDeal = async (dealId) => {
  try {
    await api.delete(`/deals/${dealId}/follow`)
    followedDeals.value = followedDeals.value.filter(deal => deal._id !== dealId)
  } catch (error) {
    console.error('Error unfollowing deal:', error)
  }
}

const isFollowing = (userId) => {
  return followingUsers.value.some(user => user._id === userId)
}

const changeAvatar = async () => {
  try {
    const response = await api.post('/users/change-avatar')
    profile.value.avatarSeed = response.data.data.avatarSeed
    // Update the auth store with the new avatar seed
    authStore.updateUser({ avatarSeed: response.data.data.avatarSeed })
    toast.success('Avatar changed successfully')
  } catch (error) {
    console.error('Error changing avatar:', error)
    toast.error('Failed to change avatar')
  }
}

// Modify the watch function
watch(currentTab, async (newTab) => {
  if (newTab === 'following') {
    await fetchFollowing()
    await fetchFollowersCount() // Add this line
  } else if (newTab === 'followedDeals') {
    await fetchFollowedDeals()
  } else if (newTab === 'followers') {
    await fetchFollowing()
    await fetchFollowers()
    await fetchFollowersCount() // Add this line
  } else if (newTab === 'deals') {
    await fetchUserDeals()
  }
})

const userFields = [
  { key: 'firstName', label: 'First Name', type: 'text' },
  { key: 'lastName', label: 'Last Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' }
]

const passwordChange = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFields = [
  { key: 'currentPassword', label: 'Current Password' },
  { key: 'newPassword', label: 'New Password' },
  { key: 'confirmPassword', label: 'Confirm New Password' }
]

const saveChanges = async () => {
  try {
    const response = await api.put('/users/me', profile.value)
    profile.value = response.data.data.user
    toast.success('User data updated successfully')
  } catch (error) {
    console.error('Error updating user data:', error)
    toast.error('Failed to update user data')
  }
}

const changePassword = async () => {
  try {
    await api.post('/users/change-password', passwordChange.value)
    toast.success('Password changed successfully')
    passwordChange.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    console.error('Error changing password:', error)
    toast.error('Failed to change password')
  }
}

const toast = useToastification()

const followingUserIds = computed(() => followingUsers.value.map(user => user._id))

const navigateToDeal = (dealId) => {
  navigateTo(`/deals/${dealId}`)
}

const isMobileMenuOpen = ref(false)

const getCurrentTabName = computed(() => {
  const currentTabObj = tabs.find(tab => tab.id === currentTab.value)
  return currentTabObj ? currentTabObj.name : ''
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const selectTab = (tabId) => {
  currentTab.value = tabId
  isMobileMenuOpen.value = false
}

const authStore = useAuthStore()

const getAvatarUrl = (userId) => {
  if (!userId) return '/default-avatar.jpg'
  // Remove '/api/v1' if it exists in the base URL to avoid double inclusion
  const baseUrl = config.public.apiBase.replace('/api/v1', '')
  return `${baseUrl}/api/v1/users/${userId}/avatar`
}

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-deal-image.jpg'
  if (imageUrl.startsWith('http')) return imageUrl
  
  // Remove '/api/v1' from the config.public.apiBase if it exists
  const baseUrl = config.public.apiBase.replace('/api/v1', '')
  
  // For paths starting with '/images/', just prepend the modified base URL
  return `${baseUrl}${imageUrl}`
}
</script>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translatey(0px);
  }
  50% {
    transform: translatey(-10px);
  }
  100% {
    transform: translatey(0px);
  }
}
</style>


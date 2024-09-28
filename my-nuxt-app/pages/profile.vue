<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <div v-if="loading" class="text-center py-8">Loading user data...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <div v-else-if="!user" class="text-center py-8 text-red-500">User data not available. Please try logging in again.</div>
    <div v-else class="bg-white shadow-lg rounded-lg overflow-hidden">
      <div class="p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-center mb-6">
          <div class="relative mb-4 sm:mb-0 sm:mr-6">
            <UserAvatar 
              :name="getUserName" 
              :size="80" 
              :src="fullProfilePictureUrl" 
            />
            <button @click="triggerFileInput" class="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*">
          </div>
          <div class="text-center sm:text-left">
            <h3 class="text-xl font-semibold">{{ getUserName }}</h3>
            <p class="text-gray-600">{{ user.email }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav class="flex whitespace-nowrap">
            <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" 
                    :class="['mr-4 sm:mr-8 py-2 px-1 border-b-2 font-medium text-sm', 
                             currentTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Tab content -->
        <div v-if="currentTab === 'info'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="field in userFields" :key="field.key" class="flex flex-col">
            <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
            <input :id="field.key" v-model="user[field.key]" :type="field.type" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="col-span-1 sm:col-span-2">
            <button @click="saveChanges" class="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">Save Changes</button>
          </div>
        </div>

        <div v-else-if="currentTab === 'password'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="field in passwordFields" :key="field.key" class="flex flex-col">
            <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
            <input :id="field.key" v-model="passwordChange[field.key]" type="password" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="col-span-1 sm:col-span-2">
            <button @click="changePassword" class="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">Change Password</button>
          </div>
        </div>

        <div v-else-if="currentTab === 'following'" class="grid grid-cols-1 gap-4">
          <div v-for="followedUser in followingUsers" :key="followedUser._id" class="flex items-center justify-between border-b border-gray-200 py-3">
            <div class="flex items-center">
              <UserAvatar 
                :name="followedUser.firstName && followedUser.lastName ? `${followedUser.firstName} ${followedUser.lastName}` : followedUser.username || ''" 
                :size="40" 
                :src="getFullProfilePictureUrl(followedUser.profilePicture)" 
                class="mr-3" 
              />
              <span class="font-medium">{{ followedUser.username }}</span>
            </div>
            <button @click="unfollowUser(followedUser._id)" class="text-blue-600 hover:text-blue-800">Unfollow</button>
          </div>
        </div>

        <div v-else-if="currentTab === 'followers'" class="grid grid-cols-1 gap-4">
          <div v-for="follower in followers" :key="follower._id" class="flex items-center justify-between border-b border-gray-200 py-3">
            <div class="flex items-center">
              <UserAvatar 
                :name="follower.firstName && follower.lastName ? `${follower.firstName} ${follower.lastName}` : follower.username || ''" 
                :size="40" 
                :src="getFullProfilePictureUrl(follower.profilePicture)" 
                class="mr-3" 
              />
              <span class="font-medium">{{ follower.username }}</span>
            </div>
            <button 
              v-if="!isFollowing(follower._id)" 
              @click="followUser(follower._id)" 
              class="text-blue-600 hover:text-blue-800"
            >
              Follow Back
            </button>
            <button 
              v-else 
              @click="unfollowUser(follower._id)" 
              class="text-gray-500 hover:text-gray-700"
            >
              Unfollow
            </button>
          </div>
        </div>

        <div v-else-if="currentTab === 'deals'">
          <UserDeals :userDeals="userDeals" />
        </div>

        <div v-else-if="currentTab === 'followedDeals'">
          <FollowedDeals :followedDeals="followedDeals" @unfollow="unfollowDeal" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import api from '~/services/api'
import FollowedDeals from '~/components/FollowedDeals.vue'
import UserDeals from '~/components/UserDeals.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useAuthStore } from '~/stores/auth'
import { useDealsStore } from '~/stores/deals'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'

const config = useRuntimeConfig()
const fileInput = ref(null)
const loading = ref(true)
const error = ref(null)

const currentTab = ref('info')
const tabs = [
  { id: 'info', name: 'Personal Info' },
  { id: 'password', name: 'Change Password' },
  { id: 'following', name: 'Following' },
  { id: 'followers', name: 'Followers' },
  { id: 'deals', name: 'My Deals' },
  { id: 'followedDeals', name: 'Followed Deals' }
]

const authStore = useAuthStore()
const dealsStore = useDealsStore()

const { user } = storeToRefs(authStore)
const userDeals = ref([])
const followedDeals = ref([])

const followingUsers = ref([])
const followers = ref([])

onMounted(async () => {
  try {
    if (!user.value) {
      await authStore.fetchUser()
    }
    await Promise.all([
      fetchUserDeals(),
      fetchFollowedDeals(),
      fetchFollowing(),
      fetchFollowers()
    ])
  } catch (err) {
    console.error('Error loading user data:', err)
    error.value = 'Error loading user data. Please try again.'
  } finally {
    loading.value = false
  }
})

const getUserName = computed(() => {
  if (!user.value) return ''
  return user.value.firstName && user.value.lastName
    ? `${user.value.firstName} ${user.value.lastName}`
    : user.value.username || ''
})

const fullProfilePictureUrl = computed(() => {
  if (!user.value || !user.value.profilePicture) return ''
  return user.value.profilePicture.startsWith('http') 
    ? user.value.profilePicture 
    : `${config.public.apiBase}${user.value.profilePicture}`
})

const getFullProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return ''
  return profilePicture.startsWith('http') 
    ? profilePicture 
    : `${config.public.apiBase}${profilePicture}`
}

const fetchFollowedDeals = async () => {
  try {
    const response = await api.get('/deals/followed')
    followedDeals.value = response.data.data.followedDeals
  } catch (error) {
    console.error('Error fetching followed deals:', error)
    throw error
  }
}

const fetchUserDeals = async () => {
  try {
    const response = await api.get('/users/me/deals')
    userDeals.value = response.data.data.deals
  } catch (error) {
    console.error('Error fetching user deals:', error)
    throw error
  }
}

const fetchFollowing = async () => {
  try {
    const response = await api.get('/users/me/following')
    followingUsers.value = response.data.data.following
  } catch (error) {
    console.error('Error fetching following users:', error)
    throw error
  }
}

const fetchFollowers = async () => {
  try {
    const response = await api.get('/users/me/followers')
    followers.value = response.data.data.followers
  } catch (error) {
    console.error('Error fetching followers:', error)
    throw error
  }
}

const followUser = async (userId) => {
  try {
    await api.post(`/users/${userId}/follow`)
    const followedUser = followers.value.find(user => user._id === userId)
    if (followedUser) {
      followingUsers.value.push(followedUser)
    }
  } catch (error) {
    console.error('Error following user:', error)
  }
}

const unfollowUser = async (userId) => {
  try {
    await api.delete(`/users/${userId}/follow`)
    followingUsers.value = followingUsers.value.filter(user => user._id !== userId)
  } catch (error) {
    console.error('Error unfollowing user:', error)
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

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    const formData = new FormData()
    formData.append('image', file)
    try {
      const response = await api.post('/users/upload-profile-picture', formData)
      user.value.profilePicture = response.data.data.user.profilePicture
    } catch (error) {
      console.error('Error uploading profile picture:', error)
    }
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

watch(currentTab, async (newTab) => {
  if (newTab === 'following') {
    await fetchFollowing()
  } else if (newTab === 'followedDeals') {
    await fetchFollowedDeals()
  } else if (newTab === 'followers') {
    await fetchFollowers()
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
    const response = await api.put('/users/me', user.value)
    user.value = response.data.data.user
    // Show success message
    console.log('User data updated successfully')
  } catch (error) {
    console.error('Error updating user data:', error)
    // Show error message
  }
}

const changePassword = async () => {
  try {
    await api.post('/users/change-password', passwordChange.value)
    // Show success message
    console.log('Password changed successfully')
    // Clear the form fields
    passwordChange.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    console.error('Error changing password:', error)
    // Show error message
  }
}

const toast = useToastification()
</script>

<style scoped>
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
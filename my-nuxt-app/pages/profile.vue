<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <div v-if="loading" class="text-center py-8">Loading user data...</div>
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ error }}</div>
    <div v-else-if="!user" class="text-center py-8 text-red-500">User data not available. Please try logging in again.</div>
    <div v-else class="bg-white shadow-lg rounded-lg overflow-hidden max-w-3xl mx-auto">
      <div class="p-4 sm:p-6">
        <!-- User Info Section -->
        <div class="flex flex-col items-center mb-6">
          <div class="relative mb-4">
            <UserAvatar 
              :name="getUserName" 
              :size="80" 
              :src="fullProfilePictureUrl" 
            />
            <button @click="triggerFileInput" class="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*">
          </div>
          <div class="text-center">
            <h3 class="text-xl font-semibold">{{ getUserName }}</h3>
            <p class="text-gray-600">{{ user.email }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ followersCount }} followers</p>
          </div>
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

        <!-- Tab content -->
        <div class="max-w-md mx-auto">
          <div v-if="currentTab === 'info'" class="space-y-4">
            <div v-for="field in userFields" :key="field.key" class="flex flex-col">
              <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
              <input :id="field.key" v-model="user[field.key]" :type="field.type" class="input-field">
            </div>
            <div>
              <button @click="saveChanges" class="btn btn-primary w-full">Save Changes</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'password'" class="space-y-4">
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
            <UserDeals :userDeals="userDeals" @dealClicked="navigateToDeal" />
          </div>

          <div v-else-if="currentTab === 'followedDeals'">
            <UserDeals :userDeals="followedDeals" @dealClicked="navigateToDeal" />
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
import UserDeals from '~/components/UserDeals.vue'
import UserAvatar from '~/components/UserAvatar.vue'
import { useToastification } from '~/composables/useToastification'

const config = useRuntimeConfig()
const fileInput = ref(null)
const loading = ref(true)
const error = ref(null)
const user = ref(null)
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

const followersCount = ref(0)

onMounted(async () => {
  try {
    loading.value = true
    const response = await api.get('/users/me')
    user.value = response.data.data.user
    await Promise.all([
      fetchFollowedDeals(),
      fetchUserDeals(),
      fetchFollowersCount()
    ])
  } catch (err) {
    error.value = 'Failed to load user data'
    console.error(err)
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

const fetchFollowersCount = async () => {
  try {
    console.log('Fetching followers...')
    const response = await api.get('/users/me/followers')
    console.log('Followers response:', response.data)
    if (response.data && response.data.data) {
      followersCount.value = response.data.data.count
      console.log('Followers count:', followersCount.value)
    } else {
      console.error('Unexpected response structure:', response.data)
    }
  } catch (error) {
    console.error('Error fetching followers:', error)
    toast.error('Failed to fetch followers count')
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
</script>

<style scoped>
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto pt-16"> <!-- Add padding-top -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">My Profile</h2>
            <button @click="closeProfile" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="flex items-center mb-6">
            <div class="relative">
              <img :src="user.avatar" alt="Profile Picture" class="w-20 h-20 rounded-full object-cover mr-6">
              <button @click="triggerFileInput" class="absolute bottom-0 right-6 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" accept="image/*">
            </div>
            <div>
              <h3 class="text-xl font-semibold">{{ user.firstName }} {{ user.lastName }}</h3>
              <p class="text-gray-600">{{ user.email }}</p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="flex">
              <button v-for="tab in tabs" :key="tab.id" @click="currentTab = tab.id" 
                      :class="['mr-8 py-2 px-1 border-b-2 font-medium text-sm', 
                               currentTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300']">
                {{ tab.name }}
              </button>
            </nav>
          </div>

          <!-- Tab content -->
          <div v-if="currentTab === 'info'" class="grid grid-cols-2 gap-4">
            <div v-for="field in userFields" :key="field.key" class="flex flex-col">
              <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
              <input :id="field.key" v-model="user[field.key]" :type="field.type" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="col-span-2">
              <button @click="saveChanges" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">Save Changes</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'password'" class="grid grid-cols-2 gap-4">
            <div v-for="field in passwordFields" :key="field.key" class="flex flex-col">
              <label :for="field.key" class="text-sm font-medium text-gray-700 mb-1">{{ field.label }}</label>
              <input :id="field.key" v-model="passwordChange[field.key]" type="password" class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="col-span-2">
              <button @click="changePassword" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">Change Password</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'following'" class="grid grid-cols-2 gap-4">
            <div v-for="user in followingUsers" :key="user.id" class="flex items-center justify-between border-b border-gray-200 py-3">
              <div class="flex items-center">
                <img :src="user.avatar" :alt="user.name" class="w-10 h-10 rounded-full object-cover mr-3">
                <span class="font-medium">{{ user.name }}</span>
              </div>
              <button class="text-blue-600 hover:text-blue-800">Unfollow</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'followers'" class="grid grid-cols-2 gap-4">
            <div v-for="user in followers" :key="user.id" class="flex items-center justify-between border-b border-gray-200 py-3">
              <div class="flex items-center">
                <img :src="user.avatar" :alt="user.name" class="w-10 h-10 rounded-full object-cover mr-3">
                <span class="font-medium">{{ user.name }}</span>
              </div>
              <button class="text-blue-600 hover:text-blue-800">Follow Back</button>
            </div>
          </div>

          <div v-else-if="currentTab === 'deals'" class="grid grid-cols-2 gap-4">
            <div v-for="deal in userDeals" :key="deal.id" class="flex items-center justify-between border-b border-gray-200 py-3">
              <div class="flex items-center">
                <img :src="deal.image" :alt="deal.title" class="w-16 h-16 object-cover mr-3 rounded-md">
                <div>
                  <h4 class="font-medium">{{ deal.title }}</h4>
                  <p class="text-sm text-gray-600">{{ deal.price }}</p>
                </div>
              </div>
              <span class="text-gray-600">{{ deal.upvotes }} upvotes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])
const fileInput = ref(null)

const currentTab = ref('info')
const tabs = [
  { id: 'info', name: 'Personal Info' },
  { id: 'password', name: 'Change Password' },
  { id: 'following', name: 'Following' },
  { id: 'followers', name: 'Followers' },
  { id: 'deals', name: 'My Deals' }
]

const user = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1'
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

const followingUsers = ref([
  { id: 1, name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 2, name: 'Bob Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
])

const followers = ref([
  { id: 3, name: 'Alice Brown', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: 4, name: 'Charlie Davis', avatar: 'https://i.pravatar.cc/150?img=5' }
])

const userDeals = ref([
  { id: 1, title: 'Wireless Earbuds', price: '$59.99', image: 'https://m.media-amazon.com/images/I/61f1YfTkTDL._AC_SL1500_.jpg', upvotes: 87 },
  { id: 2, title: 'Smart Watch', price: '$129.99', image: 'https://m.media-amazon.com/images/I/61YYXv4IQJL._AC_SL1500_.jpg', upvotes: 132 }
])

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      user.value.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const closeProfile = () => {
  emit('close')
}

const saveChanges = () => {
  // Implement save changes logic
  console.log('Saving changes:', user.value)
}

const changePassword = () => {
  // Implement change password logic
  console.log('Changing password:', passwordChange.value)
}
</script>
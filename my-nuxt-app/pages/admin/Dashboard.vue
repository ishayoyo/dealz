<!-- pages/admin/dashboard.vue -->
<template>
  <div class="admin-dashboard p-6 space-y-8">
    <h1 class="text-3xl font-heading text-primary-800 mb-8">Admin Dashboard</h1>
    
    <!-- Analytics Section -->
    <section class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-heading text-primary-700 mb-4">Analytics</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card bg-gradient-to-br from-primary-100 to-primary-200 p-4 rounded-lg">
          <h3 class="text-lg font-heading text-primary-800">Total Users</h3>
          <p class="text-3xl font-bold text-primary-600">{{ totalUsers }}</p>
        </div>
        <div class="stat-card bg-gradient-to-br from-secondary-100 to-secondary-200 p-4 rounded-lg">
          <h3 class="text-lg font-heading text-secondary-800">Total Deals</h3>
          <p class="text-3xl font-bold text-secondary-600">{{ totalDeals }}</p>
        </div>
        <div class="stat-card bg-gradient-to-br from-accent-100 to-accent-200 p-4 rounded-lg">
          <h3 class="text-lg font-heading text-accent-800">Pending Deals</h3>
          <p class="text-3xl font-bold text-accent-600">{{ pendingDeals.length }}</p>
        </div>
        <div class="stat-card bg-gradient-to-br from-chip-100 to-chip-200 p-4 rounded-lg">
          <h3 class="text-lg font-heading text-chip-800">Total Comments</h3>
          <p class="text-3xl font-bold text-chip-600">{{ totalComments }}</p>
        </div>
      </div>
    </section>
    
    <!-- Charts Section -->
    <section class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-heading text-primary-700 mb-4">Charts</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="chart-container">
          <canvas ref="dealsChartRef"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="usersChartRef"></canvas>
        </div>
      </div>
    </section>
    
    <!-- Pending Deals Section -->
    <section class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-heading text-primary-700 mb-4">Pending Deals</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-primary-100">
              <th class="p-2 text-left">Image</th>
              <th class="p-2 text-left">Title</th>
              <th class="p-2 text-left">User</th>
              <th class="p-2 text-left">Created At</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="deal in pendingDeals" :key="deal._id" class="border-b border-primary-100">
              <td class="p-2">
                <img :src="getFullImageUrl(deal.imageUrl)" alt="Deal image" class="w-16 h-16 object-cover rounded">
              </td>
              <td class="p-2">{{ deal.title }}</td>
              <td class="p-2">{{ deal.user?.username }}</td>
              <td class="p-2">{{ formatDate(deal.createdAt) }}</td>
              <td class="p-2">
                <button @click="approveDeal(deal._id)" class="btn btn-sm btn-primary mr-2">Approve</button>
                <button @click="rejectDeal(deal._id)" class="btn btn-sm btn-accent mr-2">Reject</button>
                <button @click="openEditModal(deal)" class="btn btn-sm btn-secondary">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- All Deals Section -->
    <section class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-heading text-primary-700 mb-4">All Deals</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-primary-100">
              <th class="p-2 text-left">Title</th>
              <th class="p-2 text-left">User</th>
              <th class="p-2 text-left">Status</th>
              <th class="p-2 text-left">Created At</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="deal in allDeals" :key="deal._id" class="border-b border-primary-100">
              <td class="p-2">{{ deal.title }}</td>
              <td class="p-2">{{ deal.user?.username }}</td>
              <td class="p-2">{{ deal.status }}</td>
              <td class="p-2">{{ formatDate(deal.createdAt) }}</td>
              <td class="p-2">
                <button @click="openEditModal(deal)" class="btn btn-sm btn-secondary mr-2">Edit</button>
                <button @click="deleteDeal(deal._id)" class="btn btn-sm btn-accent">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- Users Section -->
    <section class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-2xl font-heading text-primary-700 mb-4">Users</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-primary-100">
              <th class="p-2 text-left">Username</th>
              <th class="p-2 text-left">Email</th>
              <th class="p-2 text-left">Created At</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id" class="border-b border-primary-100">
              <td class="p-2">{{ user.username }}</td>
              <td class="p-2">{{ user.email }}</td>
              <td class="p-2">{{ formatDate(user.createdAt) }}</td>
              <td class="p-2">
                <button @click="deleteUser(user._id)" class="btn btn-sm btn-accent">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    
    <!-- Edit Deal Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh]">
        <div class="p-6 space-y-4">
          <h3 class="text-2xl font-heading text-primary-700 mb-4">Edit Deal</h3>
          <form @submit.prevent="submitEditDeal" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                <input v-model="editingDeal.title" id="title" type="text" class="input-field" required>
              </div>
              <div>
                <label for="price" class="block text-sm font-medium text-gray-700">Price</label>
                <input v-model="editingDeal.price" id="price" type="number" step="0.01" class="input-field" required>
              </div>
            </div>
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea v-model="editingDeal.description" id="description" class="input-field" rows="3" required></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
                <select v-model="editingDeal.category" id="category" class="input-field" required>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
              </div>
              <div>
                <label for="url" class="block text-sm font-medium text-gray-700">URL</label>
                <input v-model="editingDeal.url" id="url" type="url" class="input-field" required>
              </div>
            </div>
            <div>
              <label for="imageUrl" class="block text-sm font-medium text-gray-700">Image Path</label>
              <input v-model="editingDeal.imageUrl" id="imageUrl" type="text" class="input-field" required>
              <img v-if="editingDeal.imageUrl" :src="fullImageUrl" alt="Deal image preview" class="mt-2 w-full h-40 object-cover rounded">
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" @click="closeEditModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import Chart from 'chart.js/auto'
import api from '~/services/api'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from 'vue-toastification'

const toast = useToast()

const totalUsers = ref(0)
const totalDeals = ref(0)
const pendingDeals = ref([])
const totalComments = ref(0)
const allDeals = ref([])
const users = ref([])

const dealsChartRef = ref(null)
const usersChartRef = ref(null)

const showEditModal = ref(false)
const editingDeal = ref({})

const config = useRuntimeConfig()

const categories = ref([
  "Electronics",
  "Home",
  "Fashion",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Travel",
  "Food",
  "Auto",
  "DIY",
  "Pets",
  "Other"
]);

const fullImageUrl = computed(() => {
  if (!editingDeal.value?.imageUrl) return '/default-deal-image.jpg'
  return editingDeal.value.imageUrl.startsWith('http') 
    ? editingDeal.value.imageUrl 
    : `${getImageBaseUrl()}${editingDeal.value.imageUrl.split('/').pop()}`
})

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000/images/deals/' 
    : 'https://deals.ishay.me/images/deals/'
}

const fetchAnalytics = async () => {
  try {
    const response = await api.get('/admin/analytics');
    totalUsers.value = response.data.data.totalUsers;
    totalDeals.value = response.data.data.totalDeals;
    totalComments.value = response.data.data.totalComments;
  } catch (error) {
    console.error('Error fetching analytics:', error.response?.data || error.message);
    toast.error('Failed to fetch analytics data');
  }
};

const createDealsChart = (data) => {
  if (!dealsChartRef.value) return;
  new Chart(dealsChartRef.value, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Deals Created',
        data: data.values,
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.1
      }]
    }
  })
}

const createUsersChart = (data) => {
  if (!usersChartRef.value) return;
  new Chart(usersChartRef.value, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'New Users',
        data: data.values,
        backgroundColor: 'rgb(236, 72, 153)'
      }]
    }
  })
}

const fetchPendingDeals = async () => {
  try {
    const response = await api.get('/admin/pending-deals')
    pendingDeals.value = response.data.data.deals
  } catch (error) {
    console.error('Error fetching pending deals:', error)
    toast.error('Failed to fetch pending deals')
  }
}

const fetchAllDeals = async () => {
  try {
    const response = await api.get('/admin/deals')
    allDeals.value = response.data.data.deals
  } catch (error) {
    console.error('Error fetching all deals:', error)
    toast.error('Failed to fetch all deals')
  }
}

const fetchUsers = async () => {
  try {
    const response = await api.get('/admin/users')
    users.value = response.data.data.users
  } catch (error) {
    console.error('Error fetching users:', error)
    toast.error('Failed to fetch users')
  }
}

const approveDeal = async (dealId) => {
  try {
    await api.patch(`/admin/deals/${dealId}/moderate`, { status: 'approved' })
    await fetchPendingDeals()
    await fetchAllDeals()
    toast.success('Deal approved successfully')
  } catch (error) {
    console.error('Error approving deal:', error)
    toast.error('Failed to approve deal')
  }
}

const rejectDeal = async (dealId) => {
  try {
    await api.patch(`/admin/deals/${dealId}/moderate`, { status: 'rejected' })
    await fetchPendingDeals()
    await fetchAllDeals()
    toast.success('Deal rejected successfully')
  } catch (error) {
    console.error('Error rejecting deal:', error)
    toast.error('Failed to reject deal')
  }
}

const deleteDeal = async (dealId) => {
  try {
    await api.delete(`/admin/deals/${dealId}`)
    await fetchAllDeals()
    toast.success('Deal deleted successfully')
  } catch (error) {
    console.error('Error deleting deal:', error)
    toast.error('Failed to delete deal')
  }
}

const deleteUser = async (userId) => {
  try {
    await api.delete(`/admin/users/${userId}`)
    await fetchUsers()
    toast.success('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user')
  }
}

const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

const openEditModal = (deal) => {
  editingDeal.value = { ...deal }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingDeal.value = {}
}

const submitEditDeal = async () => {
  try {
    await api.patch(`/admin/deals/${editingDeal.value._id}`, editingDeal.value)
    await fetchAllDeals()
    await fetchPendingDeals()
    toast.success('Deal updated successfully')
    closeEditModal()
  } catch (error) {
    console.error('Error updating deal:', error)
    toast.error('Failed to update deal')
  }
}

const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-deal-image.jpg'
  return imageUrl.startsWith('http') 
    ? imageUrl 
    : `${getImageBaseUrl()}${imageUrl.split('/').pop()}`
}

onMounted(async () => {
  await fetchAnalytics();
  await fetchPendingDeals();
  await fetchAllDeals();
  await fetchUsers();
  
  try {
    const [dealsChartData, usersChartData] = await Promise.all([
      api.get('/admin/deals-chart-data'),
      api.get('/admin/users-chart-data')
    ]);
    
    createDealsChart(dealsChartData.data.data);
    createUsersChart(usersChartData.data.data);
  } catch (error) {
    console.error('Error fetching chart data:', error.response?.data || error.message);
    toast.error('Failed to fetch chart data');
  }
})
</script>
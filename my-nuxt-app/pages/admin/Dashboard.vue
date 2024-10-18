<template>
  <div class="admin-dashboard p-6 space-y-8 max-w-7xl mx-auto">
    <h1 class="text-3xl font-heading text-primary-800 mb-8 text-center">SaverSonic Admin Dashboard</h1>
    
    <!-- Add this button -->
    <div class="text-center">
      <button @click="clearCache" class="btn btn-primary">
        Clear Cache
      </button>
    </div>
    
    <!-- Analytics Section -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="(stat, index) in stats" :key="index" 
             :class="`bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 p-6 rounded-xl shadow-md`">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-heading text-gray-800">{{ stat.title }}</h3>
            <i :class="`fas fa-${stat.icon} text-${stat.color}-500 text-2xl`"></i>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ stat.value }}</p>
        </div>
      </div>
    </section>
    
    <!-- Charts Section -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Analytics Charts</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="chart in charts" :key="chart.title" class="bg-white rounded-xl shadow-md p-6">
          <h3 class="text-xl font-heading text-gray-800 mb-4">{{ chart.title }}</h3>
          <div class="chart-container">
            <canvas :ref="chart.ref"></canvas>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Affiliate Statistics Section -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Affiliate Statistics</h2>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="bg-gradient-to-br from-success-100 to-success-200 p-6 rounded-xl shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-heading text-gray-800">Total Affiliate Clicks</h3>
            <i class="fas fa-mouse-pointer text-success-500 text-2xl"></i>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ affiliateStats.totalClicks }}</p>
        </div>
        <div class="bg-gradient-to-br from-warning-100 to-warning-200 p-6 rounded-xl shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-heading text-gray-800">Amazon Clicks</h3>
            <i class="fab fa-amazon text-warning-500 text-2xl"></i>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ affiliateStats.amazonClicks }}</p>
        </div>
        <div class="bg-gradient-to-br from-info-100 to-info-200 p-6 rounded-xl shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-heading text-gray-800">AliExpress Clicks</h3>
            <i class="fas fa-shopping-bag text-info-500 text-2xl"></i>
          </div>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ affiliateStats.aliexpressClicks }}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6">
        <h3 class="text-xl font-heading text-gray-800 mb-4">Clicks Over Time</h3>
        <div class="chart-container">
          <canvas ref="clicksOverTimeChartRef"></canvas>
        </div>
      </div>
    </section>
    
    <!-- Data Tables Section -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Data Tables</h2>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div v-for="table in tables" :key="table.title" 
             :class="{'xl:col-span-2': table.title === 'Users'}"
             class="bg-white rounded-xl shadow-md p-6">
          <h3 class="text-xl font-heading text-gray-800 mb-4">{{ table.title }}</h3>
          <div class="overflow-x-auto max-h-96">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-100">
                  <th v-for="column in table.columns" :key="column.key" class="p-2 text-left">{{ column.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in table.data" :key="item._id" class="border-b border-gray-200">
                  <td v-for="column in table.columns" :key="column.key" class="p-2">
                    <template v-if="column.type === 'image'">
                      <img :src="getFullImageUrl(item[column.key])" :alt="item.title" class="w-16 h-16 object-cover rounded">
                    </template>
                    <template v-else-if="column.type === 'date'">
                      {{ formatDate(getNestedValue(item, column.key)) }}
                    </template>
                    <template v-else-if="column.type === 'actions'">
                      <button 
                        v-for="action in column.actions" 
                        :key="action"
                        v-show="action !== 'verify' || !item.isVerified"
                        @click="handleAction(action, item._id)"
                        class="btn btn-sm mr-2"
                        :class="`btn-${getActionColor(action)}`"
                      >
                        {{ action }}
                      </button>
                    </template>
                    <template v-else-if="column.key === 'isVerified'">
                      <span :class="item.isVerified ? 'text-green-600' : 'text-red-600'">
                        {{ item.isVerified ? 'Verified' : 'Not Verified' }}
                      </span>
                    </template>
                    <template v-else>
                      {{ getNestedValue(item, column.key) }}
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Edit Deal Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh]">
        <div class="p-6 space-y-4">
          <h3 class="text-2xl font-heading text-gray-800 mb-4">Edit Deal</h3>
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
import { ref, onMounted, computed, watch } from 'vue'
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
  "Electronics", "Home", "Fashion", "Beauty", "Sports", "Books", "Toys",
  "Travel", "Food", "Auto", "DIY", "Pets", "Other"
])

const affiliateStats = ref({
  totalClicks: 0,
  amazonClicks: 0,
  aliexpressClicks: 0,
  clicksOverTime: []
})

const clicksOverTimeChartRef = ref(null)

const stats = computed(() => [
  { title: 'Total Users', value: totalUsers.value, color: 'primary', icon: 'users' },
  { title: 'Total Deals', value: totalDeals.value, color: 'secondary', icon: 'tag' },
  { title: 'Pending Deals', value: pendingDeals.value.length, color: 'accent', icon: 'clock' },
  { title: 'Total Comments', value: totalComments.value, color: 'chip', icon: 'comment' }
])

const charts = [
  { title: 'Deals Over Time', ref: dealsChartRef },
  { title: 'New Users', ref: usersChartRef }
]

const tables = computed(() => [
  {
    title: 'Pending Deals',
    data: pendingDeals.value,
    columns: [
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'user.username', label: 'User' },
      { key: 'createdAt', label: 'Created At', type: 'date' },
      { key: 'actions', label: 'Actions', type: 'actions', actions: ['approve', 'reject', 'edit'] }
    ]
  },
  {
    title: 'All Deals',
    data: allDeals.value,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'user.username', label: 'User' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At', type: 'date' },
      { key: 'actions', label: 'Actions', type: 'actions', actions: ['edit', 'delete'] }
    ]
  },
  {
    title: 'Users',
    data: users.value,
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'createdAt', label: 'Created At', type: 'date' },
      { key: 'isVerified', label: 'Verification Status' },
      { key: 'actions', label: 'Actions', type: 'actions', actions: ['verify', 'delete'] }
    ]
  }
])

const fullImageUrl = computed(() => {
  if (!editingDeal.value?.imageUrl) return '/default-deal-image.jpg'
  return editingDeal.value.imageUrl.startsWith('http') 
    ? editingDeal.value.imageUrl 
    : `${getImageBaseUrl()}${editingDeal.value.imageUrl.split('/').pop()}`
})

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000/images/deals/' 
    : 'https://saversonic.com/images/deals/'
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

const handleAction = async (action, itemId) => {
  switch (action) {
    case 'approve':
      await approveDeal(itemId)
      break
    case 'reject':
      await rejectDeal(itemId)
      break
    case 'edit':
      openEditModal(allDeals.value.find(deal => deal._id === itemId) || 
                    pendingDeals.value.find(deal => deal._id === itemId))
      break
    case 'delete':
      if (confirm('Are you sure you want to delete this item?')) {
        if (users.value.find(user => user._id === itemId)) {
          await deleteUser(itemId)
        } else {
          await deleteDeal(itemId)
        }
      }
      break
    case 'verify':
      await verifyUser(itemId)
      break
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

const fetchAffiliateStats = async () => {
  try {
    const response = await api.get('/admin/affiliate-stats')
    console.log('Received affiliate stats:', response.data)
    
    affiliateStats.value = {
      totalClicks: response.data.totalClicks || 0,
      amazonClicks: response.data.amazonClicks || 0,
      aliexpressClicks: response.data.aliexpressClicks || 0,
      clicksOverTime: response.data.clicksOverTime || []
    }
    
    console.log('Updated affiliateStats:', affiliateStats.value)
    
    createClicksOverTimeChart()
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    toast.error('Failed to fetch affiliate statistics')
  }
}

const createClicksOverTimeChart = () => {
  if (!clicksOverTimeChartRef.value) return
  new Chart(clicksOverTimeChartRef.value, {
    type: 'line',
    data: {
      labels: affiliateStats.value.clicksOverTime.map(item => item.date),
      datasets: [
        {
          label: 'Total Clicks',
          data: affiliateStats.value.clicksOverTime.map(item => item.totalCount),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Amazon Clicks',
          data: affiliateStats.value.clicksOverTime.map(item => item.amazonCount),
          borderColor: 'rgb(255, 159, 64)',
          tension: 0.1
        },
        {
          label: 'AliExpress Clicks',
          data: affiliateStats.value.clicksOverTime.map(item => item.aliexpressCount),
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }
      ]
    }
  })
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

const getActionColor = (action) => {
  switch (action) {
    case 'approve': return 'success'
    case 'reject': return 'danger'
    case 'edit': return 'info'
    case 'delete': return 'danger'
    default: return 'primary'
  }
}

watch(affiliateStats, (newValue) => {
  console.log('affiliateStats changed:', newValue)
}, { deep: true })

onMounted(async () => {
  await fetchAnalytics();
  await fetchPendingDeals();
  await fetchAllDeals();
  await fetchUsers();
  await fetchAffiliateStats();
  
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

const verifyUser = async (userId) => {
  try {
    await api.patch(`/admin/users/${userId}/verify`);
    await fetchUsers();
    toast.success('User verified successfully');
  } catch (error) {
    console.error('Error verifying user:', error);
    toast.error('Failed to verify user: ' + (error.response?.data?.message || error.message));
  }
};

const clearCache = async () => {
  try {
    await api.post('/deals/clear-cache')
    toast.success('Cache cleared successfully')
  } catch (error) {
    console.error('Error clearing cache:', error)
    toast.error('Failed to clear cache')
  }
}
</script>

<style scoped>
.input-field {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.btn {
  @apply font-bold py-2 px-4 rounded;
}

.btn-sm {
  @apply py-1 px-2 text-sm;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-700;
}

.btn-success {
  @apply bg-green-500 text-white hover:bg-green-700;
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-700;
}

.btn-info {
  @apply bg-cyan-500 text-white hover:bg-cyan-700;
}

/* Add this new style for centering the content */
.admin-dashboard {
  max-width: 1280px; /* Adjust this value as needed */
  margin-left: auto;
  margin-right: auto;
}
</style>

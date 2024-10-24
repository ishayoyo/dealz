<template>
  <div class="marketing-dashboard p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
    <h1 class="text-2xl sm:text-3xl font-heading text-primary-800 mb-6 sm:mb-8 text-center">SaverSonic Media Dashboard</h1>

    <!-- Date Range Picker -->
    <div class="mb-4">
      <DateRangePicker v-model="dateRange" @update:modelValue="fetchData" />
    </div>

    <!-- Overview Stats -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Overall Performance</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clicks" :value="overallStats.totalClicks" />
        <StatCard title="Total Conversions" :value="overallStats.totalConversions" />
        <StatCard title="Overall CR" :value="overallStats.overallCR" suffix="%" :decimals="2" />
        <StatCard title="Total Revenue" :value="overallStats.totalRevenue" prefix="$" :decimals="2" />
      </div>
    </section>

    <!-- Network Comparison Chart -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Network Comparison</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <NetworkComparisonChart :chart-data="networkComparisonData" />
      </div>
    </section>

    <!-- Network Performance Table -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Network Performance</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-x-auto">
        <table class="w-full min-w-max">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Network</th>
              <th class="p-2 text-right">Clicks</th>
              <th class="p-2 text-right">Conversions</th>
              <th class="p-2 text-right">CR</th>
              <th class="p-2 text-right">Revenue</th>
              <th class="p-2 text-right">EPC</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="network in networkPerformance" :key="network.name" class="border-b border-gray-200">
              <td class="p-2">{{ network.name }}</td>
              <td class="p-2 text-right">{{ network.clicks }}</td>
              <td class="p-2 text-right">{{ network.conversions }}</td>
              <td class="p-2 text-right">{{ network.cr.toFixed(2) }}%</td>
              <td class="p-2 text-right">${{ network.revenue.toFixed(2) }}</td>
              <td class="p-2 text-right">${{ network.epc.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Pixel Performance -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Pixel Performance</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-x-auto">
        <table class="w-full min-w-max">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Network</th>
              <th class="p-2 text-left">Event</th>
              <th class="p-2 text-right">Fires</th>
              <th class="p-2 text-right">Conversions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pixel in pixelPerformance" :key="pixel.id" class="border-b border-gray-200">
              <td class="p-2">{{ pixel.network }}</td>
              <td class="p-2">{{ pixel.event }}</td>
              <td class="p-2 text-right">{{ pixel.fires }}</td>
              <td class="p-2 text-right">{{ pixel.conversions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- S2S Pixel Management -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">S2S Pixel Management</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <button @click="openPixelModal" class="btn btn-primary mb-4">Add New Pixel</button>
        <table class="w-full min-w-max">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Network</th>
              <th class="p-2 text-left">Event</th>
              <th class="p-2 text-left">Pixel URL</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pixel in s2sPixels" :key="pixel._id" class="border-b border-gray-200">
              <td class="p-2">{{ pixel.network }}</td>
              <td class="p-2">{{ pixel.event }}</td>
              <td class="p-2">
                <span class="truncate block max-w-xs">{{ pixel.url }}</span>
              </td>
              <td class="p-2">
                <button @click="editPixel(pixel)" class="btn btn-sm btn-secondary mr-2">Edit</button>
                <button @click="deletePixel(pixel._id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- S2S Pixel Modal -->
    <S2SPixelModal
      v-if="showPixelModal"
      :pixel="editingPixel"
      @close="closePixelModal"
      @save="savePixel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '~/services/api'
import { useToast } from 'vue-toastification'
import DateRangePicker from '~/components/DateRangePicker.vue'
import StatCard from '~/components/StatCard.vue'
import NetworkComparisonChart from '~/components/NetworkComparisonChart.vue'
import ConversionFunnelChart from '~/components/ConversionFunnelChart.vue'
import S2SPixelModal from '~/components/S2SPixelModal.vue'

const toast = useToast()

const dateRange = ref({
  startDate: null,
  endDate: null
})

const overallStats = ref({
  totalClicks: 0,
  totalConversions: 0,
  overallCR: 0,
  totalRevenue: 0
})

const networkComparisonData = ref([])
const networkPerformance = ref([])
const topCampaigns = ref([])
const conversionFunnelData = ref([])
const s2sPixels = ref([])
const pixelPerformance = ref([]) // New state for pixel performance

const showPixelModal = ref(false)
const editingPixel = ref({})

const fetchOverallStats = async () => {
  try {
    const response = await api.get('/marketing/stats/overall', {
      params: {
        startDate: dateRange.value.startDate,
        endDate: dateRange.value.endDate
      }
    })
    
    overallStats.value = response.data.data.stats
  } catch (error) {
    console.error('Error fetching overall stats:', error)
    toast.error('Failed to fetch overall stats')
  }
}

const fetchNetworkComparison = async () => {
  try {
    const response = await api.get('/marketing/stats/network-comparison', {
      params: {
        startDate: dateRange.value.startDate,
        endDate: dateRange.value.endDate
      }
    })
    
    networkComparisonData.value = response.data.data.networkComparison
  } catch (error) {
    console.error('Error fetching network comparison:', error)
    toast.error('Failed to fetch network comparison')
  }
}

const fetchNetworkPerformance = async () => {
  try {
    const response = await api.get('/marketing/stats/network-performance', {
      params: {
        startDate: dateRange.value.startDate,
        endDate: dateRange.value.endDate
      }
    })
    
    networkPerformance.value = response.data.data.networkPerformance
  } catch (error) {
    console.error('Error fetching network performance:', error)
    toast.error('Failed to fetch network performance')
  }
}

const fetchPixelPerformance = async () => {
  try {
    const response = await api.get('/marketing/stats/pixel-performance', {
      params: {
        startDate: dateRange.value.startDate,
        endDate: dateRange.value.endDate
      }
    })
    
    pixelPerformance.value = response.data.data.pixelPerformance
  } catch (error) {
    console.error('Error fetching pixel performance:', error)
    toast.error('Failed to fetch pixel performance')
  }
}

const fetchS2SPixels = async () => {
  try {
    const response = await api.get('/marketing/s2s-pixels')
    console.log('S2S pixels response:', response.data)
    s2sPixels.value = response.data.data.pixels
  } catch (error) {
    console.error('Error fetching S2S pixels:', error)
    toast.error('Failed to fetch S2S pixels')
  }
}

const openPixelModal = () => {
  editingPixel.value = { network: '', event: '', url: '' };
  showPixelModal.value = true;
};

const closePixelModal = () => {
  showPixelModal.value = false
  editingPixel.value = {}
}

const editPixel = (pixel) => {
  editingPixel.value = { ...pixel }
  showPixelModal.value = true
}

const deletePixel = async (pixelId) => {
  if (confirm('Are you sure you want to delete this pixel?')) {
    try {
      await api.delete(`/marketing/s2s-pixel/${pixelId}`)
      await fetchS2SPixels()
      toast.success('Pixel deleted successfully')
    } catch (error) {
      console.error('Error deleting pixel:', error)
      toast.error('Failed to delete pixel')
    }
  }
}

const savePixel = async (pixelData) => {
  try {
    console.log('Saving pixel:', pixelData); // Debugging log
    if (!pixelData.network || !pixelData.event || !pixelData.url) {
      toast.error('Please fill in all fields');
      return;
    }
    if (pixelData._id) {
      await api.put(`/marketing/s2s-pixel/${pixelData._id}`, pixelData);
      toast.success('Pixel updated successfully');
    } else {
      await api.post('/marketing/s2s-pixel', pixelData);
      toast.success('Pixel added successfully');
    }
    await fetchS2SPixels();
    closePixelModal();
  } catch (error) {
    console.error('Error saving pixel:', error.response?.data || error.message);
    toast.error(error.response?.data?.message || 'Failed to save pixel');
  }
};

// Fetch all necessary data
const fetchData = async () => {
  await Promise.all([
    fetchOverallStats(),
    fetchNetworkComparison(),
    fetchNetworkPerformance(),
    fetchPixelPerformance(), // Fetch pixel performance data
    fetchS2SPixels()
  ])
}

onMounted(async () => {
  await fetchData()
})
</script>

<style scoped>
.input-field {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50;
}

.btn {
  @apply font-bold py-2 px-4 rounded transition duration-150 ease-in-out;
}

.btn-sm {
  @apply py-1 px-2 text-sm;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-700;
}

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-700;
}
</style>

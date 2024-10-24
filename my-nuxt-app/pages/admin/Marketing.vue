<template>
  <div class="marketing-dashboard p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
    <h1 class="text-2xl sm:text-3xl font-heading text-primary-800 mb-6 sm:mb-8 text-center">SaverSonic Marketing Dashboard</h1>

    <!-- Stats Overview -->
    <section>
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Tracking Stats Overview</h2>
      
      <!-- Network Stats -->
      <div v-for="(networkData, network) in filteredStats" :key="network" class="mb-8">
        <h3 class="text-lg font-heading text-gray-700 mb-4 capitalize">{{ network }} Network</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div v-for="(value, key) in networkData" :key="key" 
               class="bg-gradient-to-br from-primary-100 to-primary-200 p-4 sm:p-6 rounded-xl shadow-md">
            <h3 class="text-base sm:text-lg font-heading text-gray-800 capitalize">{{ formatStatName(key) }}</h3>
            <p class="text-lg sm:text-xl font-bold text-gray-900 mt-2">Total: {{ value.totalCount }}</p>
            <p class="text-sm text-gray-600">Conversion Rate: {{ (value.conversionRate * 100).toFixed(2) }}%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Simple Bar Chart -->
    <section class="mt-6 sm:mt-8">
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Event Tracking Overview</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <canvas ref="chartRef" style="max-height: 300px; sm:max-height: 400px;"></canvas>
      </div>
    </section>

    <!-- Tracking Events Management -->
    <section class="mt-6 sm:mt-8">
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Tracking Events</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-x-auto">
        <button @click="openEventModal" class="btn btn-primary mb-4">Add New Event</button>
        <table class="w-full min-w-max">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Name</th>
              <th class="p-2 text-left hidden sm:table-cell">Description</th>
              <th class="p-2 text-left hidden md:table-cell">Pixel URL</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in trackingEvents" :key="event._id" class="border-b border-gray-200">
              <td class="p-2">{{ event.name }}</td>
              <td class="p-2 hidden sm:table-cell">{{ event.description }}</td>
              <td class="p-2 hidden md:table-cell">
                <span class="truncate block max-w-xs">{{ event.pixelUrl }}</span>
              </td>
              <td class="p-2">
                <button @click="editEvent(event)" class="btn btn-sm btn-secondary mr-2 mb-2 sm:mb-0">Edit</button>
                <button @click="deleteEvent(event._id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tracking Parameters Management -->
    <section class="mt-6 sm:mt-8">
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Tracking Parameters</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6 overflow-x-auto">
        <button @click="openParameterModal" class="btn btn-primary mb-4">Add New Parameter</button>
        <table class="w-full min-w-max">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Name</th>
              <th class="p-2 text-left hidden sm:table-cell">Description</th>
              <th class="p-2 text-left">Type</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in trackingParameters" :key="param._id" class="border-b border-gray-200">
              <td class="p-2">{{ param.name }}</td>
              <td class="p-2 hidden sm:table-cell">{{ param.description }}</td>
              <td class="p-2">{{ param.type }}</td>
              <td class="p-2">
                <button @click="editParameter(param)" class="btn btn-sm btn-secondary mr-2 mb-2 sm:mb-0">Edit</button>
                <button @click="deleteParameter(param._id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Event Modal -->
    <div v-if="showEventModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-2xl font-heading text-gray-800 mb-4">{{ editingEvent._id ? 'Edit' : 'Add' }} Event</h3>
        <form @submit.prevent="submitEvent" class="space-y-4">
          <div>
            <label for="eventName" class="block text-sm font-medium text-gray-700">Name</label>
            <input v-model="editingEvent.name" id="eventName" type="text" class="input-field" required>
          </div>
          <div>
            <label for="eventDescription" class="block text-sm font-medium text-gray-700">Description</label>
            <input v-model="editingEvent.description" id="eventDescription" type="text" class="input-field">
          </div>
          <div>
            <label for="eventPixelUrl" class="block text-sm font-medium text-gray-700">Pixel URL</label>
            <input v-model="editingEvent.pixelUrl" id="eventPixelUrl" type="text" class="input-field">
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" @click="closeEventModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Parameter Modal -->
    <div v-if="showParameterModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h3 class="text-2xl font-heading text-gray-800 mb-4">{{ editingParameter._id ? 'Edit' : 'Add' }} Parameter</h3>
        <form @submit.prevent="submitParameter" class="space-y-4">
          <div>
            <label for="paramName" class="block text-sm font-medium text-gray-700">Name</label>
            <input v-model="editingParameter.name" id="paramName" type="text" class="input-field" required>
          </div>
          <div>
            <label for="paramDescription" class="block text-sm font-medium text-gray-700">Description</label>
            <input v-model="editingParameter.description" id="paramDescription" type="text" class="input-field">
          </div>
          <div>
            <label for="paramType" class="block text-sm font-medium text-gray-700">Type</label>
            <select v-model="editingParameter.type" id="paramType" class="input-field" required>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" @click="closeParameterModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Fire Test Event Section -->
    <section class="mt-8 sm:mt-12 text-center">
      <div class="inline-flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 bg-white rounded-xl shadow-md p-4">
        <button @click="fireTestEvent" class="btn btn-primary w-full sm:w-auto">Fire Test Event</button>
        <span class="text-base sm:text-lg font-semibold">Count: {{ testEventCount }}</span>
      </div>
    </section>

    <!-- Add date picker to template -->
    <div class="flex space-x-4 mb-4">
      <input type="date" v-model="startDate" class="input-field">
      <input type="date" v-model="endDate" class="input-field">
      <button @click="fetchTrackingStats" class="btn btn-primary">Filter</button>
    </div>

    <!-- Add this after the date picker in template -->
    <div class="flex space-x-4 mb-4">
      <select v-model="selectedNetwork" class="input-field">
        <option v-for="network in networks" :key="network" :value="network">
          {{ network.charAt(0).toUpperCase() + network.slice(1) }}
        </option>
      </select>
    </div>

    <!-- Add this section for pixel testing -->
    <section class="mt-6 sm:mt-8">
      <h2 class="text-xl sm:text-2xl font-heading text-gray-800 mb-4">Pixel Testing</h2>
      <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div class="space-y-4">
          <!-- Test Pixel Form -->
          <form @submit.prevent="fireTestPixel" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Network</label>
              <select v-model="testPixelData.network" class="input-field" required>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <!-- Add more networks as needed -->
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Event Name</label>
              <input 
                v-model="testPixelData.eventName" 
                type="text" 
                class="input-field" 
                required
                placeholder="signup"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">SubID</label>
              <input 
                v-model="testPixelData.subid" 
                type="text" 
                class="input-field" 
                required
                placeholder="test_subid_123"
              >
            </div>

            <div>
              <button type="submit" class="btn btn-primary">
                Fire Test Pixel
              </button>
            </div>
          </form>

          <!-- Last Fired Pixel Info -->
          <div v-if="lastPixelResponse" class="mt-4">
            <h3 class="text-lg font-medium text-gray-900">Last Pixel Response:</h3>
            <pre class="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto">
              {{ JSON.stringify(lastPixelResponse, null, 2) }}
            </pre>
          </div>

          <!-- Pixel URL Preview -->
          <div v-if="testPixelUrl" class="mt-4">
            <h3 class="text-lg font-medium text-gray-900">Test Pixel URL:</h3>
            <div class="mt-2 p-4 bg-gray-50 rounded-md break-all">
              <code>{{ testPixelUrl }}</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import api from '~/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const trackingStats = ref({
  facebook: {
    SignUp: { totalCount: 0 },
    DealModalOpen: { totalCount: 0 },
    GetThisDealClick: { totalCount: 0 }
  },
  google: {
    SignUp: { totalCount: 0 },
    DealModalOpen: { totalCount: 0 },
    GetThisDealClick: { totalCount: 0 }
  },
  // Add more networks as needed
})

const trackingEvents = ref([])
const trackingParameters = ref([])

const showEventModal = ref(false)
const showParameterModal = ref(false)
const editingEvent = ref({})
const editingParameter = ref({})

const chartRef = ref(null)
const testEventCount = ref(0)
const chartInstance = ref(null)

const startDate = ref(null)
const endDate = ref(null)

// Add network filter
const selectedNetwork = ref('all')
const networks = ['all', 'facebook', 'google'] // Add your networks here

const filteredStats = computed(() => {
  if (selectedNetwork.value === 'all') {
    return trackingStats.value
  }
  return {
    [selectedNetwork.value]: trackingStats.value[selectedNetwork.value]
  }
})

const fetchTrackingStats = async () => {
  try {
    const response = await api.get('/marketing/tracking/stats', {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        network: selectedNetwork.value === 'all' ? undefined : selectedNetwork.value
      }
    })
    
    const stats = response.data.data.stats
    
    // Update stats for each network
    Object.entries(stats).forEach(([network, networkStats]) => {
      if (trackingStats.value[network]) {
        Object.entries(networkStats).forEach(([eventName, eventStats]) => {
          if (trackingStats.value[network][eventName]) {
            trackingStats.value[network][eventName] = {
              totalCount: eventStats.totalCount || 0,
              conversionRate: eventStats.conversionRate || 0,
              revenue: eventStats.revenueTotal || 0
            }
          }
        })
      }
    })
    
    createChart()
  } catch (error) {
    console.error('Error fetching tracking stats:', error)
    toast.error('Failed to fetch tracking stats')
  }
}

const fetchTrackingEvents = async () => {
  try {
    const response = await api.get('/marketing/tracking/events')
    console.log('Tracking events response:', response.data)
    trackingEvents.value = response.data.data.events
  } catch (error) {
    console.error('Error fetching tracking events:', error)
    toast.error('Failed to fetch tracking events')
  }
}

const fetchTrackingParameters = async () => {
  try {
    const response = await api.get('/marketing/tracking/parameters')
    console.log('Tracking parameters response:', response.data)
    trackingParameters.value = response.data.data.parameters
  } catch (error) {
    console.error('Error fetching tracking parameters:', error)
    toast.error('Failed to fetch tracking parameters')
  }
}

const createChart = () => {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const datasets = []
  const networks = selectedNetwork.value === 'all' 
    ? Object.keys(trackingStats.value)
    : [selectedNetwork.value]

  networks.forEach((network, index) => {
    const networkData = trackingStats.value[network]
    datasets.push({
      label: network.charAt(0).toUpperCase() + network.slice(1),
      data: Object.values(networkData).map(v => v.totalCount),
      backgroundColor: `rgba(54, ${162 + (index * 30)}, 235, 0.6)`,
      borderColor: `rgba(54, ${162 + (index * 30)}, 235, 1)`,
      borderWidth: 1
    })
  })

  chartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(trackingStats.value[networks[0]]).map(formatStatName),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true // Show legend to distinguish networks
        },
        title: {
          display: true,
          text: 'Total Events by Type',
          font: {
            size: 16
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            callback: function(value) {
              if (value % 1 === 0) {
                return value;
              }
            }
          },
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      },
      animation: {
        duration: 500
      }
    }
  })
}

const formatStatName = (name) => {
  return name.split(/(?=[A-Z])/).join(' ')
}

const openEventModal = () => {
  editingEvent.value = {}
  showEventModal.value = true
}

const closeEventModal = () => {
  showEventModal.value = false
  editingEvent.value = {}
}

const submitEvent = async () => {
  try {
    if (editingEvent.value._id) {
      await api.put(`/marketing/tracking/event/${editingEvent.value._id}`, editingEvent.value)
      toast.success('Event updated successfully')
    } else {
      await api.post('/marketing/tracking/add-event', editingEvent.value)
      toast.success('Event added successfully')
    }
    await fetchTrackingEvents()
    closeEventModal()
  } catch (error) {
    console.error('Error submitting event:', error)
    toast.error('Failed to submit event')
  }
}

const editEvent = (event) => {
  editingEvent.value = { ...event }
  showEventModal.value = true
}

const deleteEvent = async (eventId) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await api.delete(`/marketing/tracking/event/${eventId}`)
      await fetchTrackingEvents()
      toast.success('Event deleted successfully')
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }
}

const openParameterModal = () => {
  editingParameter.value = {}
  showParameterModal.value = true
}

const closeParameterModal = () => {
  showParameterModal.value = false
  editingParameter.value = {}
}

const submitParameter = async () => {
  try {
    if (editingParameter.value._id) {
      await api.put(`/marketing/tracking/parameter/${editingParameter.value._id}`, editingParameter.value)
      toast.success('Parameter updated successfully')
    } else {
      await api.post('/marketing/tracking/add-parameter', editingParameter.value)
      toast.success('Parameter added successfully')
    }
    await fetchTrackingParameters()
    closeParameterModal()
  } catch (error) {
    console.error('Error submitting parameter:', error)
    toast.error('Failed to submit parameter')
  }
}

const editParameter = (param) => {
  editingParameter.value = { ...param }
  showParameterModal.value = true
}

const deleteParameter = async (paramId) => {
  if (confirm('Are you sure you want to delete this parameter?')) {
    try {
      await api.delete(`/marketing/tracking/parameter/${paramId}`)
      await fetchTrackingParameters()
      toast.success('Parameter deleted successfully')
    } catch (error) {
      console.error('Error deleting parameter:', error)
      toast.error('Failed to delete parameter')
    }
  }
}

const fireTestEvent = async () => {
  try {
    await api.post('/marketing/tracking/log', {
      eventName: 'TestClickEvent',
      parameters: {
        testParam: 'testValue',
        subid: 'testSubId123',
        network: selectedNetwork.value === 'all' ? 'facebook' : selectedNetwork.value
      }
    });
    testEventCount.value++;
    toast.success('Test event fired');
    await fetchTrackingStats();
  } catch (error) {
    console.error('Error firing test event:', error);
    toast.error('Failed to fire test event');
  }
};

// Add these to your existing refs
const testPixelData = ref({
  network: 'facebook',
  eventName: '',
  subid: ''
})
const lastPixelResponse = ref(null)
const testPixelUrl = ref('')

// Add this method
const fireTestPixel = async () => {
  try {
    // Construct the test pixel URL
    const baseUrl = `${window.location.origin}/api/v1/marketing/test-pixel`
    const params = new URLSearchParams({
      network: testPixelData.value.network,
      eventName: testPixelData.value.eventName,
      subid: testPixelData.value.subid,
      timestamp: new Date().toISOString()
    })
    
    testPixelUrl.value = `${baseUrl}?${params.toString()}`

    // Fire the pixel
    const response = await api.get(`/marketing/test-pixel`, {
      params: {
        network: testPixelData.value.network,
        eventName: testPixelData.value.eventName,
        subid: testPixelData.value.subid
      }
    })

    lastPixelResponse.value = response.data
    toast.success('Test pixel fired successfully')
    
    // Optional: Also log the event
    await api.post('/marketing/tracking/log', {
      eventName: testPixelData.value.eventName,
      parameters: {
        network: testPixelData.value.network,
        subid: testPixelData.value.subid
      }
    })

    // Refresh stats
    await fetchTrackingStats()
  } catch (error) {
    console.error('Error firing test pixel:', error)
    toast.error('Failed to fire test pixel')
  }
}

onMounted(async () => {
  console.log('Marketing component mounted')
  await fetchTrackingStats()
  await fetchTrackingEvents()
  await fetchTrackingParameters()
  console.log('After fetching data:')
  console.log('Stats:', trackingStats.value)
  console.log('Events:', trackingEvents.value)
  console.log('Parameters:', trackingParameters.value)
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


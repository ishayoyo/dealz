<template>
  <div class="marketing-dashboard p-6 space-y-8 max-w-7xl mx-auto">
    <h1 class="text-3xl font-heading text-primary-800 mb-8 text-center">SaverSonic Marketing Dashboard</h1>

    <!-- Add this button after the main heading -->
    <button @click="fireTestEvent" class="btn btn-primary">Fire Test Event</button>

    <!-- Stats Overview -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Tracking Stats Overview</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="(value, key) in trackingStats" :key="key" 
             class="bg-gradient-to-br from-primary-100 to-primary-200 p-6 rounded-xl shadow-md">
          <h3 class="text-lg font-heading text-gray-800 capitalize">{{ formatStatName(key) }}</h3>
          <p class="text-xl font-bold text-gray-900 mt-2">Total: {{ value.totalCount }}</p>
        </div>
      </div>
    </section>

    <!-- Chart -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Event Tracking Chart</h2>
      <div class="bg-white rounded-xl shadow-md p-6">
        <canvas ref="trackingChartRef"></canvas>
      </div>
    </section>

    <!-- Tracking Events Management -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Tracking Events</h2>
      <div class="bg-white rounded-xl shadow-md p-6">
        <button @click="openEventModal" class="btn btn-primary mb-4">Add New Event</button>
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Name</th>
              <th class="p-2 text-left">Description</th>
              <th class="p-2 text-left">Pixel URL</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in trackingEvents" :key="event._id" class="border-b border-gray-200">
              <td class="p-2">{{ event.name }}</td>
              <td class="p-2">{{ event.description }}</td>
              <td class="p-2">{{ event.pixelUrl }}</td>
              <td class="p-2">
                <button @click="editEvent(event)" class="btn btn-sm btn-secondary mr-2">Edit</button>
                <button @click="deleteEvent(event._id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tracking Parameters Management -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Tracking Parameters</h2>
      <div class="bg-white rounded-xl shadow-md p-6">
        <button @click="openParameterModal" class="btn btn-primary mb-4">Add New Parameter</button>
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">Name</th>
              <th class="p-2 text-left">Description</th>
              <th class="p-2 text-left">Type</th>
              <th class="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="param in trackingParameters" :key="param._id" class="border-b border-gray-200">
              <td class="p-2">{{ param.name }}</td>
              <td class="p-2">{{ param.description }}</td>
              <td class="p-2">{{ param.type }}</td>
              <td class="p-2">
                <button @click="editParameter(param)" class="btn btn-sm btn-secondary mr-2">Edit</button>
                <button @click="deleteParameter(param._id)" class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tracking by SubID -->
    <section>
      <h2 class="text-2xl font-heading text-gray-800 mb-4">Tracking by SubID</h2>
      <div class="bg-white rounded-xl shadow-md p-6">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 text-left">SubID</th>
              <th class="p-2 text-left">Total Clicks</th>
              <th class="p-2 text-left">Unique Users</th>
              <th class="p-2 text-left">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(data, subid) in subidStats" :key="subid" class="border-b border-gray-200">
              <td class="p-2">{{ subid }}</td>
              <td class="p-2">{{ data.totalClicks }}</td>
              <td class="p-2">{{ data.uniqueUsers }}</td>
              <td class="p-2">{{ (data.conversionRate * 100).toFixed(2) }}%</td>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Chart from 'chart.js/auto'
import api from '~/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const trackingStats = ref({
  SignUp: { totalCount: 0 },
  DealModalOpen: { totalCount: 0 },
  GetThisDealClick: { totalCount: 0 }
})

const trackingEvents = ref([])
const trackingParameters = ref([])

const showEventModal = ref(false)
const showParameterModal = ref(false)
const editingEvent = ref({})
const editingParameter = ref({})

const trackingChartRef = ref(null)

const subidStats = ref({});

const fetchTrackingStats = async () => {
  try {
    const response = await api.get('/marketing/tracking/stats')
    console.log('Tracking stats response:', response.data)
    const stats = response.data.data.stats
    for (const [key, value] of Object.entries(stats)) {
      if (trackingStats.value.hasOwnProperty(key)) {
        trackingStats.value[key].totalCount = value.totalCount
      }
    }
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

const fetchSubidStats = async () => {
  try {
    const response = await api.get('/marketing/tracking/subid-stats');
    console.log('SubID stats response:', response.data);
    subidStats.value = response.data.data.stats;
  } catch (error) {
    console.error('Error fetching SubID stats:', error);
    toast.error('Failed to fetch SubID stats');
  }
};

const createTrackingChart = () => {
  if (!trackingChartRef.value) return

  new Chart(trackingChartRef.value, {
    type: 'bar',
    data: {
      labels: Object.keys(trackingStats.value).map(formatStatName),
      datasets: [{
        label: 'Event Count',
        data: Object.values(trackingStats.value),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
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
        subid: 'testSubId123'
      }
    });
    toast.success('Test event fired');
    await fetchTrackingStats();
  } catch (error) {
    console.error('Error firing test event:', error);
    toast.error('Failed to fire test event');
  }
};

onMounted(async () => {
  console.log('Marketing component mounted')
  await fetchTrackingStats()
  await fetchTrackingEvents()
  await fetchTrackingParameters()
  await fetchSubidStats();
  console.log('After fetching data:')
  console.log('Stats:', trackingStats.value)
  console.log('Events:', trackingEvents.value)
  console.log('Parameters:', trackingParameters.value)
  console.log('SubID Stats:', subidStats.value);
  createTrackingChart()
})
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

.btn-danger {
  @apply bg-red-500 text-white hover:bg-red-700;
}
</style>


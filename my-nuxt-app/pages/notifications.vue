<template>
  <div class="container mx-auto px-4 py-8 pt-24 md:pt-28">
    <div v-if="loading" class="text-center py-8">Loading notifications...</div>
    <div v-else class="bg-white shadow-lg rounded-lg overflow-hidden">
      <div class="p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 class="text-2xl font-semibold">Notifications</h2>
          <button 
            @click="markAllAsRead" 
            v-if="unreadCount > 0" 
            class="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 text-sm sm:text-base"
          >
            Mark all as read
          </button>
        </div>
        
        <div v-if="notifications.length === 0" class="text-center text-gray-500">
          No notifications to display.
        </div>
        
        <ul v-else class="divide-y divide-gray-200">
          <li v-for="notification in notifications" :key="notification._id" class="py-4">
            <div class="flex items-start sm:items-center">
              <div class="flex-shrink-0 mt-1 sm:mt-0">
                <span class="inline-block h-2 w-2 rounded-full" :class="notification.read ? 'bg-gray-300' : 'bg-blue-500'"></span>
              </div>
              <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium text-gray-900" :class="{ 'font-bold': !notification.read }">
                  {{ notification.content }}
                </p>
                <p class="text-xs sm:text-sm text-gray-500 mt-1">
                  {{ formatDate(notification.createdAt) }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0" v-if="!notification.read">
                <button @click="markAsRead(notification._id)" class="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Mark as read
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotificationStore } from '~/stores/notification'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'
const toast = useToastification()

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)
const loading = ref(true)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

onMounted(async () => {
  await notificationStore.fetchNotifications()
  loading.value = false
})

const markAsRead = async (notificationId) => {
  try {
    await notificationStore.markNotificationAsRead(notificationId)
    toast.success('Notification marked as read')
  } catch (error) {
    toast.error('Failed to mark notification as read')
  }
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllNotificationsAsRead()
    toast.success('All notifications marked as read')
  } catch (error) {
    toast.error('Failed to mark all notifications as read')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}
</script>
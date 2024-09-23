<template>
    <div class="container mx-auto px-4 py-8 pt-24">
      <div v-if="loading" class="text-center py-8">Loading notifications...</div>
      <div v-else class="bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-6">
          <h2 class="text-2xl font-semibold mb-6">Notifications</h2>
          
          <div v-if="notifications.length === 0" class="text-center text-gray-500">
            No notifications to display.
          </div>
          
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="notification in notifications" :key="notification._id" class="py-4">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <span class="inline-block h-2 w-2 rounded-full" :class="notification.read ? 'bg-gray-300' : 'bg-blue-500'"></span>
                </div>
                <div class="ml-3 w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900" :class="{ 'font-bold': !notification.read }">
                    {{ notification.message }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(notification.createdAt) }}
                  </p>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <button @click="markAsRead(notification._id)" v-if="!notification.read" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Mark as read
                  </button>
                </div>
              </div>
            </li>
          </ul>
          
          <div v-if="notifications.length > 0" class="mt-6 flex justify-end">
            <button @click="markAllAsRead" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300">
              Mark all as read
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useNotificationStore } from '~/stores/notification'
  import { storeToRefs } from 'pinia'
  
  const notificationStore = useNotificationStore()
  const { notifications } = storeToRefs(notificationStore)
  const loading = ref(true)
  
  onMounted(async () => {
    await notificationStore.fetchNotifications()
    loading.value = false
  })
  
  const markAsRead = async (notificationId) => {
    await notificationStore.markNotificationAsRead(notificationId)
  }
  
  const markAllAsRead = async () => {
    await notificationStore.markAllNotificationsAsRead()
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }
  </script>
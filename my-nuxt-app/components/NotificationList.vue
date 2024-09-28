<template>
  <div class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
    <div class="py-2">
      <h3 class="text-lg leading-6 font-medium text-gray-900 px-4 py-2">Notifications</h3>
      <div v-if="sortedNotifications.length === 0" class="px-4 py-2 text-sm text-gray-500">
        No notifications
      </div>
      <ul v-else class="divide-y divide-gray-200">
        <li v-for="notification in sortedNotifications" :key="notification._id" class="px-4 py-3 hover:bg-gray-50">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span class="inline-block h-2 w-2 rounded-full" :class="notification.read ? 'bg-gray-300' : 'bg-blue-500'"></span>
            </div>
            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-gray-900" :class="{ 'font-bold': !notification.read }">
                {{ notification.content }}
              </p>
              <p class="text-sm text-gray-500">
                {{ formatDate(notification.createdAt) }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0" v-if="!notification.read">
              <button @click.stop="markAsRead(notification._id)" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Mark as read
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
      <NuxtLink to="/notifications" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        View all notifications
      </NuxtLink>
      <button @click="markAllAsRead" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
        Mark all as read
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'

const notificationStore = useNotificationStore()
const { notifications, unreadCount } = storeToRefs(notificationStore)
const emit = defineEmits(['close'])  // This line should already exist

const sortedNotifications = computed(() => {
  return notifications.value.slice(0, 5).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const markAsRead = async (notificationId) => {
  await notificationStore.markNotificationAsRead(notificationId)
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllNotificationsAsRead()
    await notificationStore.fetchNotifications() // Fetch fresh notifications
    emit('close')
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    // Handle the error (e.g., show a toast notification)
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}
</script>
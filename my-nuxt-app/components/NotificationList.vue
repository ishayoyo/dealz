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
                  <template v-if="notification.type === 'MENTION'">
                    You were mentioned in a comment on 
                    <NuxtLink :to="`/deals/${notification.relatedDeal._id}`" class="text-blue-600 hover:underline">
                      {{ notification.relatedDeal.title }}
                    </NuxtLink>
                  </template>
                  <template v-else>
                    {{ notification.content }}
                  </template>
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(notification.createdAt) }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0">
                <button @click="markAsRead(notification._id)" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Mark as read
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6">
        <NuxtLink to="/notifications" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          View all notifications
        </NuxtLink>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useNotificationStore } from '~/stores/notification'
  import { storeToRefs } from 'pinia'
  
  const notificationStore = useNotificationStore()
  const { notifications } = storeToRefs(notificationStore)
  
  const sortedNotifications = computed(() => {
    console.log('Current notifications:', notifications.value)
    return notifications.value.slice(0, 5)
  })
    
  const markAsRead = (notificationId) => {
    notificationStore.markNotificationAsRead(notificationId)
  }
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }
  
  console.log('All notifications:', notifications.value);
  const mentionNotifications = computed(() => 
    notifications.value.filter(n => n.type === 'MENTION')
  );
  console.log('Mention notifications:', mentionNotifications.value);
  
  defineEmits(['close'])
  </script>
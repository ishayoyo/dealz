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
                <span v-html="formatNotificationContent(notification)"></span>
              </p>
              <p class="text-sm text-gray-500">
                {{ formatDate(notification.createdAt) }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0" v-if="!notification.read">
              <button @click.stop="markAsRead(notification._id)" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-300">
                Mark as read
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
      <NuxtLink to="/notifications" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-300">
        View all notifications
      </NuxtLink>
      <button @click="markAllAsRead" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-300">
        Mark all as read
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, unreadCount } = storeToRefs(notificationStore)
const emit = defineEmits(['close'])

const sortedNotifications = computed(() => {
  return notifications.value.slice(0, 5).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const markAsRead = async (notificationId) => {
  await notificationStore.markNotificationAsRead(notificationId)
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllNotificationsAsRead()
    await notificationStore.fetchNotifications()
    emit('close')
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const formatNotificationContent = (notification) => {
  let content = ''
  switch (notification.type) {
    case 'DEAL_APPROVED':
      content = `Your deal "<a href="#" class="debug-link text-blue-600 hover:underline" data-type="deal" data-id="${notification.relatedDeal?._id}">${notification.relatedDeal?.title || 'Untitled'}</a>" has been approved!`
      break
    case 'USER_FOLLOW':
      content = `<a href="#" class="debug-link text-blue-600 hover:underline" data-type="user" data-id="${notification.relatedUser?._id}">${notification.relatedUser?.username || 'A user'}</a> started following you`
      break
    case 'DEAL_FOLLOW':
      content = `<a href="#" class="debug-link text-blue-600 hover:underline" data-type="user" data-id="${notification.relatedUser?._id}">${notification.relatedUser?.username || 'A user'}</a> followed your deal "<a href="#" class="debug-link text-blue-600 hover:underline" data-type="deal" data-id="${notification.relatedDeal?._id}">${notification.relatedDeal?.title || 'Untitled'}</a>"`
      break
    case 'COMMENT':
    case 'NEW_COMMENT':
      content = `<a href="#" class="debug-link text-blue-600 hover:underline" data-type="user" data-id="${notification.relatedUser?._id}">${notification.relatedUser?.username || 'Someone'}</a> commented on your deal: <a href="#" class="debug-link text-blue-600 hover:underline" data-type="deal" data-id="${notification.relatedDeal?._id}">${notification.relatedDeal?.title || 'Untitled'}</a>`
      break
    case 'MENTION':
      content = `<a href="#" class="debug-link text-blue-600 hover:underline" data-type="user" data-id="${notification.relatedUser?._id}">${notification.relatedUser?.username || 'Someone'}</a> mentioned you in a comment on "<a href="#" class="debug-link text-blue-600 hover:underline" data-type="deal" data-id="${notification.relatedDeal?._id}">${notification.relatedDeal?.title || 'Untitled'}</a>"`
      break
    default:
      content = notification.content
  }
  return content
}

const navigateToUser = (userId) => {
  router.push(`/user/${userId}`)
  emit('close')
}

const navigateToDeal = (dealId) => {
  router.push(`/deals/${dealId}`)
  emit('close')
}

onMounted(() => {
  const handleClick = (event) => {
    const target = event.target.closest('.debug-link')
    if (target) {
      event.preventDefault()
      event.stopPropagation()
      const type = target.dataset.type
      const id = target.dataset.id
      if (type === 'user') {
        navigateToUser(id)
      } else if (type === 'deal') {
        navigateToDeal(id)
      }
    }
  }

  document.addEventListener('click', handleClick)

  onUnmounted(() => {
    document.removeEventListener('click', handleClick)
  })
})
</script>
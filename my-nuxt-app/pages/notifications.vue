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
        
        <div v-if="groupedNotifications.length === 0" class="text-center text-gray-500">
          No notifications to display.
        </div>
        
        <div v-else>
          <div v-for="(group, index) in groupedNotifications" :key="index" class="mb-8">
            <h3 class="text-lg font-semibold mb-4">{{ group.date }}</h3>
            <ul class="divide-y divide-gray-200">
              <li v-for="notification in group.notifications" :key="notification._id" class="py-4">
                <div class="flex items-start sm:items-center">
                  <div class="flex-shrink-0 mt-1 sm:mt-0">
                    <span class="inline-block h-2 w-2 rounded-full" :class="notification.read ? 'bg-gray-300' : 'bg-blue-500'"></span>
                  </div>
                  <div class="ml-3 w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900" :class="{ 'font-bold': !notification.read }">
                      <span v-html="formatNotificationContent(notification)"></span>
                    </p>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1">
                      {{ formatTime(notification.createdAt) }}
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useNotificationStore } from '~/stores/notification'
import { storeToRefs } from 'pinia'
import { useToastification } from '~/composables/useToastification'
import { useRouter } from 'vue-router'

const toast = useToastification()
const router = useRouter()

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)
const loading = ref(true)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const groupedNotifications = computed(() => {
  const groups = {}
  notifications.value.forEach(notification => {
    const date = new Date(notification.createdAt).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
  })
  return Object.entries(groups).map(([date, notifications]) => ({
    date,
    notifications: notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })).sort((a, b) => new Date(b.date) - new Date(a.date))
})

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

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatNotificationContent = (notification) => {
  let content = ''
  switch (notification.type) {
    case 'DEAL_APPROVED':
      content = `Your deal "${
        notification.relatedDeal?.title || 
        (notification.relatedDeal ? 'Untitled' : 'Deleted deal')
      }" has been approved!`
      break
      
    case 'USER_FOLLOW':
      content = `${
        notification.relatedUser?.username || 
        (notification.relatedUser ? 'A user' : 'Deleted user')
      } started following you`
      break
      
    case 'DEAL_FOLLOW':
      content = `${
        notification.relatedUser?.username || 
        (notification.relatedUser ? 'A user' : 'Deleted user')
      } followed your deal "${
        notification.relatedDeal?.title || 
        (notification.relatedDeal ? 'Untitled' : 'Deleted deal')
      }"`
      break
      
    case 'COMMENT':
    case 'NEW_COMMENT':
      content = `${
        notification.relatedUser?.username || 
        (notification.relatedUser ? 'Someone' : 'Deleted user')
      } commented on your deal: ${
        notification.relatedDeal?.title || 
        (notification.relatedDeal ? 'Untitled' : 'Deleted deal')
      }`
      break
      
    case 'MENTION':
      content = `${
        notification.relatedUser?.username || 
        (notification.relatedUser ? 'Someone' : 'Deleted user')
      } mentioned you in a comment on "${
        notification.relatedDeal?.title || 
        (notification.relatedDeal ? 'Untitled' : 'Deleted deal')
      }"`
      break
      
    default:
      content = notification.content
  }

  // Only add links if the related entities exist
  if (content) {
    // Add user link if user exists
    if (notification.relatedUser?._id) {
      const username = notification.relatedUser.username || 'A user'
      content = content.replace(
        username,
        `<a href="#" class="notification-link text-blue-600 hover:underline" data-type="user" data-id="${notification.relatedUser._id}">${username}</a>`
      )
    }

    // Add deal link if deal exists
    if (notification.relatedDeal?._id) {
      const dealTitle = notification.relatedDeal.title || 'Untitled'
      content = content.replace(
        `"${dealTitle}"`,
        `"<a href="#" class="notification-link text-blue-600 hover:underline" data-type="deal" data-id="${notification.relatedDeal._id}">${dealTitle}</a>"`
      )
    }
  }

  return content
}

const navigateToUser = (userId) => {
  router.push(`/user/${userId}`)
}

const navigateToDeal = (dealId) => {
  router.push(`/deals/${dealId}`)
}

onMounted(() => {
  const handleClick = (event) => {
    const target = event.target.closest('.notification-link')
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

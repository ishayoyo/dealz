// plugins/socket.js
import io from 'socket.io-client'
import { useNotificationStore } from '~/stores/notification'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const socket = io(config.public.socketUrl || 'http://localhost:5000') // Your server URL

  const notificationStore = useNotificationStore()

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server')
  })

  // Listen for new notifications
  socket.on('newNotification', (notification) => {
    notificationStore.handleNewNotification(notification)
  })

  return {
    provide: {
      socket: socket
    }
  }
})
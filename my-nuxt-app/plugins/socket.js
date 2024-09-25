import io from 'socket.io-client'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()

  const socket = io(config.public.socketUrl || 'http://localhost:5000', {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  nuxtApp.provide('socket', socket)

  if (process.client) {
    console.log('Connecting socket in plugin...')
    socket.connect()

    socket.on('connect', () => {
      console.log('Socket connected in plugin:', socket.id)
      if (authStore.isAuthenticated) {
        console.log('Joining room for user:', authStore.user.id)
        socket.emit('join', { userId: authStore.user.id })
      }
      notificationStore.setupSocketListeners(socket)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error in plugin:', error.message)
    })

    // Listen for authentication changes
    watch(() => authStore.isAuthenticated, (isAuthenticated) => {
      if (isAuthenticated) {
        if (!socket.connected) {
          socket.connect()
        }
        console.log('User authenticated, joining room:', authStore.user.id)
        socket.emit('join', { userId: authStore.user.id })
      } else {
        if (socket.connected) {
          socket.disconnect()
        }
      }
    }, { immediate: true })

    socket.on('newNotification', (notification) => {
      console.log('Received new notification:', notification);
      notificationStore.handleNewNotification(notification);
    });
  }
})
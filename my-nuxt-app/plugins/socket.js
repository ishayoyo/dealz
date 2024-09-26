import io from 'socket.io-client'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useDealsStore } from '~/stores/deals'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  const dealsStore = useDealsStore()

  const socket = io(config.public.socketUrl || 'http://localhost:5000', {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
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
      // You can add additional error handling here, such as showing a toast message
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, you need to reconnect manually
        socket.connect()
      }
      // Else the socket will automatically try to reconnect
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

    socket.on('newDeal', (deal) => {
      console.log('Received new deal:', deal);
      dealsStore.addNewDeal(deal);
    });
  }
})
import io from 'socket.io-client'
import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { useDealsStore } from '~/stores/deals'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  const dealsStore = useDealsStore()

  const socket = io(config.public.socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket'],
    withCredentials: true,
    path: '/socket.io/'
  })

  nuxtApp.provide('socket', socket)

  if (process.client) {
    watch(() => authStore.isAuthenticated, (isAuthenticated) => {
      if (isAuthenticated && !socket.connected) {
        console.log('User authenticated, connecting socket...')
        socket.connect()
        socket.emit('join', { userId: authStore.user.id })
      } else if (!isAuthenticated && socket.connected) {
        console.log('User logged out, disconnecting socket...')
        socket.disconnect()
      }
    }, { immediate: true })

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      if (authStore.isAuthenticated) {
        socket.emit('join', { userId: authStore.user.id })
      }
      notificationStore.setupSocketListeners(socket)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      const retryDelay = Math.min(1000 * Math.pow(2, socket.reconnectAttempts), 10000);
      setTimeout(() => {
        if (authStore.isAuthenticated && !socket.connected) {
          socket.connect();
        }
      }, retryDelay);
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        if (authStore.isAuthenticated) {
          socket.connect();
        }
      }
    })

    socket.on('newNotification', (notification) => {
      console.log('Received new notification:', notification);
      notificationStore.handleNewNotification(notification);
      
      if (notification.type === 'USER_FOLLOW') {
        toast.success(notification.content);
      }
    })

    socket.on('newDeal', (payload) => {
      console.log('Received new deal payload:', payload)
      if (!payload || typeof payload !== 'object') {
        console.error('Invalid deal payload received:', payload)
        return
      }
      if (authStore.user.role === 'admin' || payload.status === 'approved') {
        dealsStore.handleNewDeal(payload)
      } else {
        console.log('Ignoring unapproved deal for non-admin user')
      }
    })

    socket.on('followerCountUpdate', (data) => {
      console.log('Received follower count update:', data)
      const authStore = useAuthStore()
      if (authStore.user && authStore.user.id === data.userId) {
        authStore.updateFollowerCount(data.count)
      }
    })

    socket.on('dealStatusChanged', (payload) => {
      console.log('Received deal status change:', payload)
      if (payload.status === 'approved') {
        dealsStore.handleDealApproval(payload.deal)
        toast.success(`Deal "${payload.deal.title}" has been approved!`)
      }
    })

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.io.on('reconnect', (attempt) => {
      console.log('Socket reconnected after', attempt, 'attempts');
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log('Socket reconnection attempt:', attempt);
    });
  }

  nuxtApp.hook('app:beforeMount', () => {
    if (socket.connected) {
      socket.disconnect()
    }
  })
})

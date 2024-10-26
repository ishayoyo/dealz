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
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      if (reason === 'io server disconnect') {
        socket.connect()
      }
    })

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
      console.log('Received new notification:', notification)
      notificationStore.handleNewNotification(notification)
      
      // Show a toast notification for deal approval
      if (notification.type === 'DEAL_APPROVED') {
        toast.success(notification.content)
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
        // Update the deals store
        dealsStore.handleDealApproval(payload.deal)
        
        // Show success notification
        toast.success(`Deal "${payload.deal.title}" has been approved!`)
      }
    })
  }
})

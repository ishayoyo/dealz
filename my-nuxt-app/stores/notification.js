import { defineStore } from 'pinia'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    loading: false,
    error: null,
  }),

  actions: {
    addNotification(notification) {
      console.log('Adding notification:', notification)
      this.notifications.unshift(notification)
    },

    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n._id === notificationId)
      if (notification) {
        notification.read = true
      }
    },

    setNotifications(notifications) {
      console.log('Setting notifications:', notifications)
      this.notifications = notifications || []
    },

    async fetchNotifications() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/users/notifications')
        console.log('Fetched notifications:', response.data)
        this.setNotifications(response.data.data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        this.error = error.response?.data?.message || 'Failed to fetch notifications'
        this.setNotifications([])
      } finally {
        this.loading = false
      }
    },

    async markNotificationAsRead(notificationId) {
      try {
        await api.patch(`/users/notifications/${notificationId}/read`)
        this.markAsRead(notificationId)
      } catch (error) {
        console.error('Error marking notification as read:', error)
        throw error
      }
    },

    clearNotifications() {
      this.notifications = []
    },

    handleNewNotification(notification) {
      console.log('Handling new notification in store:', notification);
      this.addNotification(notification);
    },

    setupSocketListeners(socket) {
      console.log('Setting up socket listeners for notifications')
      socket.on('newNotification', (notification) => {
        console.log('Received new notification:', notification)
        this.addNotification(notification)
      })
    },

    async markAllNotificationsAsRead() {
      try {
        await api.patch('/users/notifications/read-all')
        this.notifications = this.notifications.map(n => ({ ...n, read: true }))
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
        throw error
      }
    },

    async removeNotification(notificationId) {
      try {
        await api.delete(`/users/notifications/${notificationId}`)
        this.notifications = this.notifications.filter(n => n._id !== notificationId)
      } catch (error) {
        console.error('Error removing notification:', error)
        throw error
      }
    },
  },

  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.read).length,
    sortedNotifications: (state) => [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
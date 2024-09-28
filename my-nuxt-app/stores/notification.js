import { defineStore } from 'pinia'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    loading: false,
    error: null,
    unreadCount: 0,
  }),

  actions: {
    addNotification(notification) {
      console.log('Adding notification:', notification)
      this.notifications.unshift(notification)
      this.updateUnreadCount()
    },

    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n._id === notificationId)
      if (notification) {
        notification.read = true
        this.updateUnreadCount()
      }
    },

    setNotifications(notifications) {
      console.log('Setting notifications:', notifications)
      this.notifications = notifications || []
      this.updateUnreadCount()
      console.log('Updated notifications:', this.notifications)
      console.log('Updated unread count:', this.unreadCount)
    },

    async fetchNotifications() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/users/notifications')
        console.log('Fetch notifications API response:', response.data)
        if (response.data.status === 'success') {
          this.setNotifications(response.data.data.notifications)
          console.log('Fetched notifications:', this.notifications)
          console.log('Unread count after fetch:', this.unreadCount)
        }
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
      this.updateUnreadCount()
    },

    handleNewNotification(notification) {
      console.log('Handling new notification in store:', notification);
      this.addNotification(notification);
    },

    setupSocketListeners(socket) {
      console.log('Setting up socket listeners for notifications')
      socket.on('newNotification', (notification) => {
        console.log('Received new notification:', notification)
        // Only add the notification if it's not already in the list
        if (!this.notifications.some(n => n._id === notification._id)) {
          this.addNotification(notification)
        }
      })

      // Add a listener for updated notifications
      socket.on('updateNotification', (updatedNotification) => {
        console.log('Received updated notification:', updatedNotification)
        const index = this.notifications.findIndex(n => n._id === updatedNotification._id)
        if (index !== -1) {
          this.notifications[index] = updatedNotification
          this.updateUnreadCount()
        }
      })
    },

    async markAllNotificationsAsRead() {
      try {
        const response = await api.patch('/users/notifications/read-all')
        console.log('Mark all as read API response:', response.data)
        if (response.data.status === 'success') {
          this.setNotifications(response.data.data.notifications)
          console.log('All notifications marked as read:', this.notifications)
          console.log('Unread count after marking all as read:', this.unreadCount)
        }
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

    updateUnreadCount() {
      this.unreadCount = this.notifications.filter(n => !n.read).length
      console.log('Updated unread count:', this.unreadCount)
    },
  },

  getters: {
    sortedNotifications: (state) => [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
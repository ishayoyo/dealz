// stores/notification.js
import { defineStore } from 'pinia'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    // userId removed from state
  }),

  actions: {
    addNotification(notification) {
      this.notifications.unshift(notification)
    },
    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n._id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    setNotifications(notifications) {
      this.notifications = notifications || []
    },
    async fetchNotifications() {
      try {
        const { data } = await api.get('/notifications')
        this.setNotifications(data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        this.setNotifications([])
      }
    },
    async markNotificationAsRead(notificationId) {
      try {
        await api.put(`/notifications/${notificationId}/read`)
        this.markAsRead(notificationId)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    },
    async markAllNotificationsAsRead() {
      try {
        await api.put('/notifications/mark-all-read')
        this.notifications = this.notifications.map(n => ({ ...n, read: true }))
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
      }
    },
    clearNotifications() {
      this.notifications = []
    },
    removeNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n._id !== notificationId)
    },
    handleNewNotification(notification) {
      console.log('Received new notification:', notification)
      this.addNotification(notification)
    },

    setupSocketListeners(socket) {
      socket.on('newNotification', (notification) => {
        this.handleNewNotification(notification)
      })
    },
  },

  getters: {
    unreadCount: (state) => (state.notifications || []).filter(n => !n.read).length,
    sortedNotifications: (state) => [...(state.notifications || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
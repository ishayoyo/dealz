// stores/notification.js
import { defineStore } from 'pinia'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
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
      try {
        const { data } = await api.get('/users/notifications')
        console.log('Fetched notifications:', data)
        this.setNotifications(data.data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        this.setNotifications([])
      }
    },
    async markNotificationAsRead(notificationId) {
      try {
        await api.patch(`/users/notifications/${notificationId}/read`)
        this.markAsRead(notificationId)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    },
    clearNotifications() {
      this.notifications = []
    },
    handleNewNotification(notification) {
      console.log('Received new notification:', notification)
      this.addNotification(notification)
    },
  },

  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.read).length,
    sortedNotifications: (state) => [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
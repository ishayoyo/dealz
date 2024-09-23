// File: stores/notification.js

import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    userId: null // You might want to set this when the user logs in
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
      this.notifications = notifications
    },
    async fetchNotifications() {
      try {
        const { data } = await $fetch('/api/notifications')
        this.setNotifications(data.notifications)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    },
    async markNotificationAsRead(notificationId) {
      try {
        await $fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
        this.markAsRead(notificationId)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    },
    setUserId(userId) {
      this.userId = userId
    }
  },

  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.read).length
  }
})
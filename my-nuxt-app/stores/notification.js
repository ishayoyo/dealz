import { defineStore } from 'pinia'
import api from '../services/api'
import { useAuthStore } from './auth'
import { useSocket } from '~/composables/useSocket'

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
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        this.setNotifications([]);
        return;
      }

      this.loading = true;
      this.error = null;
      try {
        const response = await api.get('/users/notifications');
        if (response.data.status === 'success') {
          this.setNotifications(response.data.data.notifications);
        }
      } catch (error) {
        if (error.response && error.response.status !== 401) {
          console.error('Error fetching notifications:', error);
          this.error = error.response?.data?.message || 'Failed to fetch notifications';
        }
        this.setNotifications([]);
      } finally {
        this.loading = false;
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

    async initializeNotifications() {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return;

      try {
        // First fetch notifications
        await this.fetchNotifications();
        
        // Then setup socket listeners if socket is available
        if (process.client) {
          // Wait a bit for socket to be ready
          setTimeout(() => {
            const socket = useSocket();
            if (socket?.connected) {
              this.setupSocketListeners(socket);
            }
          }, 1000); // Give socket time to connect
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    },

    setupSocketListeners(socket) {
      if (!socket?.on) {
        console.warn('Socket not properly initialized');
        return;
      }

      try {
        socket.on('newNotification', (notification) => {
          if (!this.notifications.some(n => n._id === notification._id)) {
            this.addNotification(notification);
          }
        });

        socket.on('removeNotification', (notificationId) => {
          this.notifications = this.notifications.filter(n => n._id !== notificationId);
          this.updateUnreadCount();
        });

        socket.on('updateNotification', (updatedNotification) => {
          const index = this.notifications.findIndex(n => n._id === updatedNotification._id);
          if (index !== -1) {
            const existing = this.notifications[index];
            this.notifications[index] = {
              ...existing,
              read: updatedNotification.read,
              // Carefully merge related entities
              relatedUser: updatedNotification.relatedUser ? {
                _id: updatedNotification.relatedUser._id,
                username: updatedNotification.relatedUser.username || existing.relatedUser?.username,
                profilePicture: updatedNotification.relatedUser.profilePicture || existing.relatedUser?.profilePicture
              } : existing.relatedUser,
              
              relatedDeal: updatedNotification.relatedDeal ? {
                _id: updatedNotification.relatedDeal._id,
                title: updatedNotification.relatedDeal.title || existing.relatedDeal?.title
              } : existing.relatedDeal,
              
              relatedComment: updatedNotification.relatedComment ? {
                _id: updatedNotification.relatedComment._id,
                content: updatedNotification.relatedComment.content || existing.relatedComment?.content
              } : existing.relatedComment
            };
            this.updateUnreadCount();
          }
        });
      } catch (error) {
        console.error('Error setting up socket listeners:', error);
      }
    },

    async markAllNotificationsAsRead() {
      try {
        const response = await api.patch('/users/notifications/read-all');
        if (response.data.status === 'success') {
          const populatedNotifications = response.data.data.notifications;
          
          this.notifications = this.notifications.map(existing => {
            const updated = populatedNotifications.find(n => n._id === existing._id);
            if (!updated) return existing;

            return {
              ...existing,
              read: true,
              // Carefully merge related entities
              relatedUser: updated.relatedUser ? {
                _id: updated.relatedUser._id,
                username: updated.relatedUser.username || existing.relatedUser?.username,
                profilePicture: updated.relatedUser.profilePicture || existing.relatedUser?.profilePicture
              } : existing.relatedUser,
              
              relatedDeal: updated.relatedDeal ? {
                _id: updated.relatedDeal._id,
                title: updated.relatedDeal.title || existing.relatedDeal?.title
              } : existing.relatedDeal,
              
              relatedComment: updated.relatedComment ? {
                _id: updated.relatedComment._id,
                content: updated.relatedComment.content || existing.relatedComment?.content
              } : existing.relatedComment
            };
          });
          
          this.updateUnreadCount();
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
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

    reset() {
      this.notifications = [];
      this.loading = false;
      this.error = null;
      this.unreadCount = 0;
      this.initialized = false;
    }
  },

  getters: {
    sortedNotifications: (state) => [...state.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
})
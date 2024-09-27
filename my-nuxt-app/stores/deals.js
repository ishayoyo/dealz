import { defineStore } from 'pinia'
import api from '~/services/api'
import { useAuthStore } from '~/stores/auth'

export const useDealsStore = defineStore('deals', {
  state: () => ({
    deals: [],
    userDeals: [],
    followedDeals: [],
    loading: false,
    error: null,
  }),

  getters: {
    getSortedDeals: (state) => {
      return [...state.deals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    getDealById: (state) => (id) => {
      return state.deals.find(deal => deal._id === id)
    },
  },

  actions: {
    async fetchDeals() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/deals')
        this.deals = response.data.data.deals || []
        console.log('Fetched deals:', this.deals)
      } catch (error) {
        console.error('Error fetching deals:', error)
        this.error = error.message || 'Failed to fetch deals'
      } finally {
        this.loading = false
      }
    },

    handleNewDeal(deal) {
      console.log('Handling new deal in store:', deal)
      const authStore = useAuthStore()
      if (deal.user && deal.user._id === authStore.user?._id) {
        const index = this.deals.findIndex(d => d._id === deal._id)
        if (index !== -1) {
          // Update existing deal
          this.deals = [
            ...this.deals.slice(0, index),
            { ...this.deals[index], ...deal },
            ...this.deals.slice(index + 1)
          ]
        } else {
          // Add new deal
          this.deals = [deal, ...this.deals]
        }
        
        // Update userDeals if necessary
        if (deal.user._id === this.getCurrentUserId()) {
          const userIndex = this.userDeals.findIndex(d => d._id === deal._id)
          if (userIndex !== -1) {
            this.userDeals = [
              ...this.userDeals.slice(0, userIndex),
              { ...this.userDeals[userIndex], ...deal },
              ...this.userDeals.slice(userIndex + 1)
            ]
          } else {
            this.userDeals = [deal, ...this.userDeals]
          }
        }
      }
      console.log('Updated deals in store:', this.deals)
    },

    async fetchUserDeals() {
      try {
        const response = await api.get('/users/me/deals')
        this.userDeals = response.data.data.deals || []
      } catch (error) {
        console.error('Error fetching user deals:', error)
        throw error
      }
    },

    async fetchFollowedDeals() {
      try {
        const response = await api.get('/users/me/followed-deals')
        this.followedDeals = response.data.data.followedDeals || []
      } catch (error) {
        console.error('Error fetching followed deals:', error)
        throw error
      }
    },

    async postDeal(dealData) {
      try {
        const response = await api.post('/deals', dealData)
        const newDeal = response.data.data.deal
        this.handleNewDeal(newDeal)
        return newDeal
      } catch (error) {
        console.error('Error posting deal:', error)
        throw error
      }
    },

    getCurrentUserId() {
      const authStore = useAuthStore()
      return authStore.user ? authStore.user._id : null
    },

    async searchDeals(query) {
      try {
        const response = await api.get('/deals/search', { params: { query } })
        return response.data.data
      } catch (error) {
        console.error('Error searching deals:', error)
        throw error
      }
    },

    // You can add more actions here as needed, such as followDeal, unfollowDeal, etc.
  },
})
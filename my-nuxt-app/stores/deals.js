// stores/deals.js
import { defineStore } from 'pinia'
import api from '~/services/api'
import { useAuthStore } from '~/stores/auth'

export const useDealsStore = defineStore('deals', {
  state: () => ({
    deals: [],
    userDeals: [],
    loading: false,
    error: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filterStatus: 'all'
  }),

  getters: {
    getSortedDeals: (state) => {
      const authStore = useAuthStore()
      let filteredDeals = state.deals

      // Filter deals based on status and user role
      if (state.filterStatus !== 'all') {
        filteredDeals = filteredDeals.filter(deal => deal.status === state.filterStatus)
      }
      if (!authStore.user || authStore.user.role !== 'admin') {
        filteredDeals = filteredDeals.filter(deal => deal.status === 'approved')
      }

      // Sort deals
      return filteredDeals.sort((a, b) => {
        let comparison = 0
        if (a[state.sortBy] > b[state.sortBy]) comparison = 1
        if (a[state.sortBy] < b[state.sortBy]) comparison = -1
        return state.sortOrder === 'desc' ? comparison * -1 : comparison
      })
    },
    getDealById: (state) => (id) => state.deals.find(deal => deal._id === id)
  },

  actions: {
    async fetchDeals() {
      this.loading = true
      try {
        const response = await api.get('/deals')
        this.deals = response.data.data.deals
        this.loading = false
      } catch (error) {
        console.error('Error fetching deals:', error)
        this.error = 'Failed to fetch deals'
        this.loading = false
      }
    },

    async fetchUserDeals() {
      this.loading = true
      try {
        const response = await api.get('/deals/user')
        this.userDeals = response.data.data.deals
        this.loading = false
      } catch (error) {
        console.error('Error fetching user deals:', error)
        this.error = 'Failed to fetch user deals'
        this.loading = false
      }
    },

    async postDeal(dealData) {
      try {
        const response = await api.post('/deals', dealData)
        const newDeal = response.data.data.deal
        this.handleNewDeal(newDeal);  // Pass the deal directly
        return newDeal
      } catch (error) {
        console.error('Error posting deal:', error)
        throw error
      }
    },

    async updateDeal(id, updateData) {
      try {
        const response = await api.patch(`/deals/${id}`, updateData)
        const updatedDeal = response.data.data.deal
        const index = this.deals.findIndex(deal => deal._id === id)
        if (index !== -1) {
          this.deals[index] = updatedDeal
        }
        const userIndex = this.userDeals.findIndex(deal => deal._id === id)
        if (userIndex !== -1) {
          this.userDeals[userIndex] = updatedDeal
        }
        return updatedDeal
      } catch (error) {
        console.error('Error updating deal:', error)
        throw error
      }
    },

    async deleteDeal(id) {
      try {
        await api.delete(`/deals/${id}`)
        this.deals = this.deals.filter(deal => deal._id !== id)
        this.userDeals = this.userDeals.filter(deal => deal._id !== id)
      } catch (error) {
        console.error('Error deleting deal:', error)
        throw error
      }
    },

    handleNewDeal(payload) {
      console.log('Handling new deal in store:', payload);
      
      let deal;
      if (payload && payload.deal) {
        deal = payload.deal;
      } else if (payload && payload.title) {
        // If the payload is the deal itself
        deal = payload;
      } else {
        console.error('Invalid payload in handleNewDeal:', payload);
        return;
      }
      
      if (!deal._id) {
        console.error('Received deal without _id in handleNewDeal:', deal);
        return;
      }

      const authStore = useAuthStore();
      
      if (authStore.user.role !== 'admin' && deal.status !== 'approved' && deal.user._id !== authStore.user.id) {
        console.log('Ignoring unapproved deal for non-admin user');
        return;
      }

      const index = this.deals.findIndex(d => d._id === deal._id);
      if (index !== -1) {
        // Update existing deal
        this.deals = [
          ...this.deals.slice(0, index),
          { ...this.deals[index], ...deal },
          ...this.deals.slice(index + 1)
        ];
      } else {
        // Add new deal
        this.deals = [deal, ...this.deals];
      }
      
      // Update userDeals if necessary
      if (deal.user && deal.user._id === authStore.user.id) {
        const userIndex = this.userDeals.findIndex(d => d._id === deal._id);
        if (userIndex !== -1) {
          this.userDeals = [
            ...this.userDeals.slice(0, userIndex),
            { ...this.userDeals[userIndex], ...deal },
            ...this.userDeals.slice(userIndex + 1)
          ];
        } else {
          this.userDeals = [deal, ...this.userDeals];
        }
      }

      console.log('Updated deals in store:', this.deals);
    },

    setSortBy(sortBy) {
      this.sortBy = sortBy
    },

    setSortOrder(sortOrder) {
      this.sortOrder = sortOrder
    },

    setFilterStatus(status) {
      this.filterStatus = status
    }
  }
})
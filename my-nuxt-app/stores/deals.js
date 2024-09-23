import { defineStore } from 'pinia'
import api from '~/services/api'

export const useDealsStore = defineStore('deals', {
  state: () => ({
    deals: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchDeals() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/deals')
        this.deals = response.data.data.deals
      } catch (error) {
        console.error('Error fetching deals:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    async fetchUserDeals() {
      const response = await api.get('/users/me/deals')
      this.userDeals = response.data.data.deals
    },
    async fetchFollowedDeals() {
      const response = await api.get('/users/me/followed-deals')
      this.followedDeals = response.data.data.followedDeals
    },
    async postDeal(dealData) {
      const response = await api.post('/deals', dealData)
      this.deals.unshift(response.data.data.deal)
      this.userDeals.unshift(response.data.data.deal)
    },
    async followDeal(dealId) {
      await api.post(`/deals/${dealId}/follow`)
      const deal = this.deals.find(d => d._id === dealId)
      if (deal) this.followedDeals.push(deal)
    },
    async unfollowDeal(dealId) {
      await api.delete(`/deals/${dealId}/follow`)
      this.followedDeals = this.followedDeals.filter(d => d._id !== dealId)
    },
  },
})
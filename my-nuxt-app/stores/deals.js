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
      const now = new Date()
      return [...state.deals].sort((a, b) => {
        // Calculate scores for each deal
        const scoreA = calculateDealScore(a, now)
        const scoreB = calculateDealScore(b, now)
        // Sort in descending order of score
        return scoreB - scoreA
      })
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
        // Ensure each deal has a commentCount property
        this.deals = this.deals.map(deal => ({
          ...deal,
          commentCount: deal.commentCount || 0
        }))
        console.log('Fetched deals:', this.deals)
      } catch (error) {
        console.error('Error fetching deals:', error)
        this.error = error.response?.data?.message || 'Failed to fetch deals'
      } finally {
        this.loading = false
      }
    },

    handleNewDeal(deal) {
      console.log('Handling new deal in store:', deal)
      const authStore = useAuthStore()
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
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/deals/search', { params: { query } })
        return response.data.data.deals // Make sure this matches your API response structure
      } catch (error) {
        console.error('Error searching deals:', error)
        this.error = error.response?.data?.message || 'Failed to search deals'
        throw error
      } finally {
        this.loading = false
      }
    },

    async toggleFollowDeal(dealId) {
      try {
        const deal = this.deals.find(d => d._id === dealId)
        if (!deal) throw new Error('Deal not found')

        const endpoint = deal.isFollowing ? `/deals/${dealId}/unfollow` : `/deals/${dealId}/follow`
        const method = deal.isFollowing ? 'delete' : 'post'

        await api[method](endpoint)

        // Update the deal in the store
        deal.isFollowing = !deal.isFollowing
        deal.followCount += deal.isFollowing ? 1 : -1

        // Update followedDeals if necessary
        if (deal.isFollowing) {
          this.followedDeals.push(deal)
        } else {
          this.followedDeals = this.followedDeals.filter(d => d._id !== dealId)
        }

        return deal
      } catch (error) {
        console.error('Error toggling deal follow status:', error)
        throw error
      }
    },

    updateDealFollowStatus(dealId, isFollowing, followCount) {
      const deal = this.deals.find(d => d._id === dealId)
      if (deal) {
        deal.isFollowing = isFollowing
        deal.followCount = followCount
      }

      // Update in userDeals if present
      const userDeal = this.userDeals.find(d => d._id === dealId)
      if (userDeal) {
        userDeal.isFollowing = isFollowing
        userDeal.followCount = followCount
      }

      // Update in followedDeals
      if (isFollowing) {
        if (!this.followedDeals.some(d => d._id === dealId)) {
          this.followedDeals.push({ ...deal })
        }
      } else {
        this.followedDeals = this.followedDeals.filter(d => d._id !== dealId)
      }
    }
  },
})

// Helper function to calculate deal score
function calculateDealScore(deal, now) {
  const ageInHours = (now - new Date(deal.createdAt)) / (1000 * 60 * 60)
  const recencyScore = Math.max(0, 100 - ageInHours) // Score decreases over time, max 100
  const commentScore = Math.min(100, deal.commentCount * 5) // 5 points per comment, max 100
  return recencyScore + commentScore // Total score out of 200
}
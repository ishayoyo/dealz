// stores/deals.js
import { defineStore } from 'pinia'
import api from '~/services/api'
import { useAuthStore } from '~/stores/auth'

// Helper function to handle API calls with retry logic
const handleApiCall = async (apiCall) => {
  try {
    return await apiCall()
  } catch (error) {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      try {
        const refreshed = await authStore.refreshToken()
        if (refreshed) {
          // Retry the original request
          return await apiCall()
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError)
        throw refreshError
      }
    }
    throw error
  }
}

export const useDealsStore = defineStore('deals', {
  state: () => ({
    deals: [],
    dealCache: new Map(),
    loading: false,
    error: null,
    lastFetch: null,
    page: 1,
    hasMore: true,
    limit: 12,
    totalDeals: 0,
    selectedCategories: [],
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
    async fetchDeals({ bypassCache = false } = {}) {
      console.log('fetchDeals called:', {
        loading: this.loading,
        hasMore: this.hasMore,
        page: this.page,
        currentDealsCount: this.deals.length,
        totalDeals: this.totalDeals
      })

      if (this.loading || (!this.hasMore && !bypassCache)) {
        console.log('Fetch cancelled - loading or no more deals')
        return
      }
      
      this.loading = true
      
      try {
        const categories = Array.isArray(this.selectedCategories) 
          ? this.selectedCategories.filter(Boolean) 
          : [];

        const response = await handleApiCall(() => 
          api.get('/deals', { 
            params: { 
              page: this.page,
              limit: this.limit,
              categories: categories.length > 0 ? categories : undefined,
              _t: Date.now()
            }
          })
        )
        
        const { deals: newDeals, total } = response.data.data
        this.totalDeals = total

        // If we get no new deals, stop pagination
        if (!newDeals || newDeals.length === 0) {
          this.hasMore = false
          console.log('No more deals to load')
          return
        }

        if (this.page === 1) {
          this.deals = newDeals
        } else {
          const existingIds = new Set(this.deals.map(d => d._id))
          const uniqueNewDeals = newDeals.filter(d => !existingIds.has(d._id))
          this.deals = [...this.deals, ...uniqueNewDeals]
        }
        
        // Update hasMore based on total count and current deals
        this.hasMore = this.deals.length < total
        if (this.hasMore) {
          this.page += 1
        }

        console.log('Store updated:', {
          dealsLength: this.deals.length,
          totalDeals: this.totalDeals,
          hasMore: this.hasMore,
          nextPage: this.page
        })
      } catch (error) {
        console.error('Error fetching deals:', error)
        this.error = 'Failed to fetch deals'
        this.hasMore = false
      } finally {
        this.loading = false
      }
    },

    resetPagination() {
      console.log('Resetting pagination')
      this.page = 1
      this.hasMore = true
      this.deals = []
      this.totalDeals = 0
      this.error = null
      this.loading = false
    },

    async fetchUserDeals() {
      this.loading = true
      try {
        const response = await handleApiCall(() => api.get('/deals/user'))
        this.userDeals = response.data.data.deals
        this.loading = false
      } catch (error) {
        console.error('Error fetching user deals:', error)
        this.error = 'Failed to fetch user deals'
        this.loading = false
        throw error
      }
    },

    async postDeal(dealData) {
      try {
        const response = await handleApiCall(() => api.post('/deals', dealData))
        const newDeal = response.data.data.deal
        this.handleNewDeal(newDeal)
        return newDeal
      } catch (error) {
        console.error('Error posting deal:', error)
        throw error
      }
    },

    async updateDeal(id, updateData) {
      try {
        const response = await handleApiCall(() => api.patch(`/deals/${id}`, updateData))
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
        await handleApiCall(() => api.delete(`/deals/${id}`))
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
    },

    updateDealFollowStatus(dealId, isFollowing, followCount) {
      const deal = this.deals.find(d => d._id === dealId);
      if (deal) {
        deal.isFollowing = isFollowing;
        deal.followCount = followCount;
      }
      const userDeal = this.userDeals.find(d => d._id === dealId);
      if (userDeal) {
        userDeal.isFollowing = isFollowing;
        userDeal.followCount = followCount;
      }
    },

    async fetchDealById(id) {
      try {
        // Check cache first
        const cachedDeal = this.dealCache.get(id)
        const cacheAge = this.lastFetch ? Date.now() - this.lastFetch : Infinity
        
        if (cachedDeal && cacheAge < 5 * 60 * 1000) { // 5 minutes cache
          return { data: { deal: cachedDeal } }
        }

        const response = await handleApiCall(() => api.get(`/deals/${id}`))
        
        if (response?.data?.data?.deal) {
          this.dealCache.set(id, response.data.data.deal)
          this.lastFetch = Date.now()
          
          // Update deals array if needed
          const dealIndex = this.deals.findIndex(d => d._id === id)
          if (dealIndex === -1) {
            this.deals.push(response.data.data.deal)
          }
        }
        
        return response.data
      } catch (error) {
        console.error('Error fetching deal:', error)
        throw error
      }
    },

    async searchDeals(query, options = {}) {
      this.loading = true
      try {
        console.log('Sending search request with query:', query, 'and options:', options)
        const params = {
          q: query,
          category: options.category,
          store: options.store,
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
          sortBy: options.sortBy,
          page: options.page,
          limit: options.limit
        }
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
        
        const response = await handleApiCall(() => api.get('/deals/search', { params }))
        console.log('Search response:', response.data)
        this.loading = false
        return response.data.data.deals
      } catch (error) {
        console.error('Error searching deals:', error)
        this.error = 'Failed to search deals'
        this.loading = false
        throw error
      }
    },

    handleDealApproval(deal) {
      // If the deal is in pending state, update it
      const index = this.deals.findIndex(d => d._id === deal._id)
      if (index !== -1) {
        this.deals[index] = deal
      } else {
        // If it's not in the list, add it at the beginning
        this.deals.unshift(deal)
      }
    },

    refreshDeals() {
      // Force a reactive update by creating a new array
      this.deals = [...this.deals]
    },

    setSelectedCategories(categories) {
      this.selectedCategories = categories
      this.resetPagination()
      this.fetchDeals()
    },

    clearCache() {
      this.dealCache.clear()
      this.lastFetch = null
    }
  }
})

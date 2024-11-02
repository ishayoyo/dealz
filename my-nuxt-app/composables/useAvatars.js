import { ref } from 'vue'
import api from '~/services/api'

export const useAvatars = () => {
  const avatarCache = ref(new Map())
  
  const fetchBatchAvatars = async (userIds) => {
    // Filter out IDs we already have in cache
    const uncachedIds = userIds.filter(id => !avatarCache.value.has(id))
    
    if (uncachedIds.length === 0) return
    
    try {
      const response = await api.post('/users/batch-avatars', {
        userIds: uncachedIds
      })
      
      // Update cache with new avatars
      Object.entries(response.data.data.avatars).forEach(([userId, avatarUrl]) => {
        avatarCache.value.set(userId, avatarUrl)
      })
    } catch (error) {
      console.error('Error fetching batch avatars:', error)
      // Set default avatars for failed fetches
      uncachedIds.forEach(id => {
        avatarCache.value.set(id, 'https://api.dicebear.com/6.x/avataaars/svg?seed=default')
      })
    }
  }
  
  const getAvatar = (userId) => {
    return avatarCache.value.get(userId) || 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  }
  
  return {
    fetchBatchAvatars,
    getAvatar,
    avatarCache
  }
} 
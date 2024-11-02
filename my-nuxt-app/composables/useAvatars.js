import { ref } from 'vue'
import api from '~/services/api'

// Create shared state outside the composable
const globalAvatarCache = ref(new Map())
const globalCacheVersion = ref(0)

export const useAvatars = () => {
  const getAvatar = (userId) => {
    if (!userId) return 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
    return globalAvatarCache.value.get(userId) || 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  }

  const clearCache = (userId) => {
    if (userId) {
      globalAvatarCache.value.delete(userId)
    } else {
      globalAvatarCache.value.clear()
    }
    globalCacheVersion.value++
  }

  const fetchBatchAvatars = async (userIds) => {
    try {
      // Filter out userIds that are already in cache
      const uncachedIds = userIds.filter(id => !globalAvatarCache.value.has(id))
      
      if (uncachedIds.length === 0) return {}

      const response = await api.post('/users/batch-avatars', { userIds: uncachedIds })
      const newAvatars = response.data.data.avatars
      
      Object.entries(newAvatars).forEach(([userId, avatarUrl]) => {
        globalAvatarCache.value.set(userId, avatarUrl)
      })
      
      globalCacheVersion.value++
      return newAvatars
    } catch (error) {
      console.error('Error fetching avatars:', error)
      return {}
    }
  }

  return {
    fetchBatchAvatars,
    getAvatar,
    clearCache,
    avatarCache: globalAvatarCache,
    cacheVersion: globalCacheVersion
  }
}

export default useAvatars 
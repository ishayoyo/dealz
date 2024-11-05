import { ref } from 'vue'
import api from '~/services/api'
import { useNuxtApp } from '#app'

const globalAvatarCache = ref(new Map())
const globalCacheVersion = ref(0)

export const useAvatars = () => {
  const { $socket } = useNuxtApp()

  // Initialize socket listener only once
  if (!globalAvatarCache.value.has('__initialized__')) {
    $socket.on('avatarChanged', ({ userId, avatarSeed }) => {
      if (userId) {
        // Update cache with new avatar URL
        const newAvatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed}`
        globalAvatarCache.value.set(userId, newAvatarUrl)
        globalCacheVersion.value++
      }
    })
    globalAvatarCache.value.set('__initialized__', true)
  }

  const getAvatar = (userId, seed) => {
    if (!userId) return 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
    
    // Return from cache if available
    if (globalAvatarCache.value.has(userId)) {
      return globalAvatarCache.value.get(userId)
    }
    
    // Generate URL from seed if provided
    if (seed) {
      const avatarUrl = `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`
      globalAvatarCache.value.set(userId, avatarUrl)
      return avatarUrl
    }
    
    return 'https://api.dicebear.com/6.x/avataaars/svg?seed=default'
  }

  const clearCache = (userId) => {
    if (userId) {
      globalAvatarCache.value.delete(userId)
    } else {
      globalAvatarCache.value.clear()
      globalAvatarCache.value.set('__initialized__', true)
    }
    globalCacheVersion.value++
  }

  const fetchBatchAvatars = async (userIds) => {
    try {
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
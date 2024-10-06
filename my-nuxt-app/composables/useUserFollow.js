import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastification } from '~/composables/useToastification'
import api from '~/services/api'

export function useUserFollow() {
  const authStore = useAuthStore()
  const toast = useToastification()

  const followUser = async (userId, initialFollowState) => {
    if (!authStore.isAuthenticated) {
      toast.info("Please log in to follow users")
      return { success: false, isFollowing: initialFollowState }
    }

    try {
      const method = initialFollowState ? 'delete' : 'post'
      const response = await api[method](`/users/${userId}/follow`)

      if (response.data && response.data.status === 'success') {
        const newFollowState = !initialFollowState
        toast.success(newFollowState ? 'User followed successfully' : 'User unfollowed successfully')
        return { 
          success: true, 
          isFollowing: newFollowState, 
          followerCount: response.data.data?.followerCount 
        }
      } else {
        throw new Error(response.data.message || 'Unexpected response from server')
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      if (error.response?.data?.message === 'You are already following this user') {
        toast.info('You are already following this user')
        return { success: true, isFollowing: true }
      } else {
        toast.error('An error occurred while following/unfollowing the user')
        return { success: false, isFollowing: initialFollowState }
      }
    }
  }

  return { followUser }
}
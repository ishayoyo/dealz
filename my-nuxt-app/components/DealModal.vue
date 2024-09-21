<template>
  <div v-if="deal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-md w-full max-w-5xl max-h-[90vh] overflow-hidden flex relative">
      <!-- Close button -->
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-700 hover:text-gray-900 z-20 bg-white rounded-md p-2 shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Left column: Image -->
      <div class="w-1/2">
        <img :src="deal.image" :alt="deal.title" class="w-full h-full object-cover">
      </div>
      
      <!-- Right column: Content -->
      <div class="w-1/2 p-8 overflow-y-auto">
        <h2 class="text-3xl font-bold mb-4">{{ deal.title }}</h2>
        <p class="text-gray-600 mb-6">{{ deal.description }}</p>
        
        <div class="flex items-center justify-between mb-6">
          <span class="font-bold text-green-500 text-2xl">{{ deal.price }}</span>
          <div class="flex items-center space-x-4">
            <button @click="followDeal" class="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600">
              {{ isFollowingDeal ? 'Unfollow' : 'Follow' }} Deal
            </button>
            <div class="flex flex-col items-center">
              <button @click="upvote" class="text-gray-500 hover:text-green-500">
                <i class="fas fa-chevron-up text-2xl"></i>
              </button>
              <span class="font-bold text-xl my-1">{{ votes }}</span>
              <button @click="downvote" class="text-gray-500 hover:text-red-500">
                <i class="fas fa-chevron-down text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mb-6 flex items-center">
          <img :src="deal.userAvatar" :alt="deal.postedBy" class="w-10 h-10 rounded-full mr-3">
          <div class="flex-grow">
            <span class="text-sm text-gray-500">Posted by:</span>
            <span class="font-semibold ml-1">{{ deal.postedBy }}</span>
          </div>
          <button @click="followUser" class="bg-blue-500 text-white rounded-md px-3 py-1 text-sm hover:bg-blue-600">
            {{ isFollowingUser ? 'Unfollow' : 'Follow' }}
          </button>
        </div>
        
        <div class="border-t pt-6">
          <h3 class="font-bold text-xl mb-4">Comments</h3>
          <div v-for="comment in comments" :key="comment.id" class="mb-4">
            <div class="flex items-center mb-2">
              <img :src="comment.userAvatar" :alt="comment.username" class="w-8 h-8 rounded-full mr-2">
              <span class="font-semibold">{{ comment.username }}</span>
            </div>
            <p class="text-gray-600">{{ comment.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['deal'],
  data() {
    return {
      isFollowingDeal: false,
      isFollowingUser: false,
      votes: this.deal ? this.deal.upvotes : 0,
      comments: [
        { id: 1, username: 'User1', userAvatar: 'https://i.pravatar.cc/150?img=1', text: 'Great deal! Thanks for sharing.' },
        { id: 2, username: 'User2', userAvatar: 'https://i.pravatar.cc/150?img=2', text: 'I bought this last week. Highly recommended!' },
        { id: 3, username: 'User3', userAvatar: 'https://i.pravatar.cc/150?img=3', text: 'Does anyone know if this works with Android?' },
      ]
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal')
    },
    followDeal() {
      this.isFollowingDeal = !this.isFollowingDeal
      // Here you would typically make an API call to follow/unfollow the deal
    },
    followUser() {
      this.isFollowingUser = !this.isFollowingUser
      // Here you would typically make an API call to follow/unfollow the user
    },
    upvote() {
      this.votes++
      // Here you would typically make an API call to upvote the deal
    },
    downvote() {
      this.votes--
      // Here you would typically make an API call to downvote the deal
    }
  }
}
</script>
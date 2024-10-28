<!-- components/FollowedDeals.vue -->
<template>
  <div>
    <!-- Deals Grid -->
    <div v-if="followedDeals && followedDeals.length > 0" 
         class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <DealCard 
        v-for="deal in followedDeals" 
        :key="deal._id" 
        :deal="deal"
        :username="deal.user?.username"
        @open-modal="navigateToDeal" 
        class="deal-card cursor-pointer transition duration-300 transform hover:scale-105"
      >
        <template #actions>
          <button 
            @click.stop="$emit('unfollow', deal._id)" 
            class="btn btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <i class="fas fa-heart text-primary-500"></i>
            <span>Unfollow Deal</span>
          </button>
        </template>
      </DealCard>
    </div>

    <!-- Empty State -->
    <div v-else class="deal-card p-8 text-center">
      <div class="animate-float">
        <i class="fas fa-heart text-4xl text-primary-300 mb-4"></i>
      </div>
      <h3 class="text-xl font-heading font-semibold text-indigo-900 mb-2">
        No Followed Deals Yet
      </h3>
      <p class="text-gray-600 mb-6">
        Start following deals to keep track of the best offers!
      </p>
      <NuxtLink 
        to="/deals" 
        class="btn btn-primary inline-flex items-center space-x-2"
      >
        <i class="fas fa-compass"></i>
        <span>Discover Deals</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
import DealCard from '~/components/DealCard.vue'

const props = defineProps({
  followedDeals: {
    type: Array,
    default: () => []
  }
})

defineEmits(['unfollow'])

const navigateToDeal = (dealId) => {
  navigateTo(`/deals/${dealId}`)
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Optional: Add a subtle shadow animation on hover */
.deal-card {
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.1), 0 2px 4px -1px rgba(99, 102, 241, 0.06);
  transition: all 0.3s ease;
}

.deal-card:hover {
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04);
}
</style>

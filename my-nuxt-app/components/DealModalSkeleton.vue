<template>
  <div 
    class="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto"
    role="status"
    aria-label="Loading deal information"
  >
    <div class="animate-pulse flex flex-col md:flex-row">
      <!-- Image skeleton with shimmer -->
      <div class="md:w-1/2 relative overflow-hidden">
        <div class="aspect-square bg-gray-300 rounded-lg animate-shimmer"></div>
      </div>
      
      <!-- Content skeleton with progressive loading -->
      <div class="md:w-1/2 md:pl-6 mt-4 md:mt-0 space-y-4">
        <div class="space-y-4 animate-fade-in-up" style="--delay: 100ms">
          <!-- Enhanced skeleton elements -->
          <div class="h-8 bg-gray-300 rounded-lg w-3/4 animate-shimmer"></div>
          <div class="space-y-2">
            <div class="h-10 bg-gray-300 rounded-lg w-1/3 animate-shimmer"></div>
            <div class="h-4 bg-gray-300 rounded-lg w-1/4 animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Screen reader only text -->
    <span class="sr-only">Loading deal information...</span>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: var(--delay, 0ms);
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

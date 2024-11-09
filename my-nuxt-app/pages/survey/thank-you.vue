<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full mx-auto text-center p-8">
      <div class="mb-8">
        <i class="fas fa-check-circle text-6xl text-green-500"></i>
      </div>
      <h1 class="text-3xl font-bold mb-4">Thank You!</h1>
      <p class="text-gray-600 mb-8">
        Your feedback helps us improve SaverSonic for everyone.
      </p>
      <button 
        @click="$router.push('/')"
        class="btn btn-primary"
      >
        Back to Deals
      </button>
    </div>
  </div>
</template>

<style scoped>
.btn-primary {
  @apply bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg 
         hover:from-indigo-600 hover:to-purple-700 transition-all duration-300;
}
</style> 
<template>
  <div class="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
    <div class="animate-pulse flex flex-col md:flex-row">
      <!-- Image skeleton -->
      <div class="md:w-1/2 relative">
        <div class="aspect-square bg-gray-300 rounded-lg"></div>
      </div>
      
      <!-- Content skeleton -->
      <div class="md:w-1/2 md:pl-6 mt-4 md:mt-0 space-y-4">
        <!-- Title -->
        <div class="h-8 bg-gray-300 rounded-lg w-3/4"></div>
        
        <!-- Price area -->
        <div class="space-y-2">
          <div class="h-10 bg-gray-300 rounded-lg w-1/3"></div>
          <div class="h-4 bg-gray-300 rounded-lg w-1/4"></div>
        </div>
        
        <!-- Description lines -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-300 rounded-lg w-full"></div>
          <div class="h-4 bg-gray-300 rounded-lg w-5/6"></div>
          <div class="h-4 bg-gray-300 rounded-lg w-4/5"></div>
        </div>
        
        <!-- Action buttons -->
        <div class="flex space-x-4">
          <div class="h-12 bg-gray-300 rounded-full w-1/2"></div>
          <div class="h-12 bg-gray-300 rounded-full w-1/2"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No script needed for this component
</script>

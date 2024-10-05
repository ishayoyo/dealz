<template>
    <div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div class="max-w-md w-full space-y-8 text-center">
        <div class="animate-float text-8xl mb-8">
          💸
        </div>
        <h2 class="mt-6 text-4xl font-extrabold text-indigo-900">
          {{ error.statusCode === 404 ? 'Oops! Deal Not Found' : 'Oops! Something went wrong' }}
        </h2>
        <p class="mt-2 text-lg text-gray-600">
          {{ error.statusCode === 404 ? 'It looks like this deal has slipped through our fingers!' : error.message }}
        </p>
        <div class="mt-8 space-y-4">
          <p class="text-md text-gray-500">
            Don't worry, there are plenty more deals to discover:
          </p>
          <div class="flex justify-center">
            <button @click="handleError" class="btn btn-primary">
              Browse Deals
            </button>
          </div>
        </div>
        <div class="mt-8">
          <p class="text-sm text-gray-500">
            If you believe this is an error, please <a href="/contact" class="font-medium text-indigo-600 hover:text-indigo-500">contact our support team</a>.
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    error: Object
  })
  
  const handleError = () => {
    clearError({ redirect: '/' })
  }
  </script>
<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center">
        <span class="text-xl font-bold mr-4">Logo</span>
        <input type="search" placeholder="Search deals..." class="bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex items-center">
        <template v-if="!isLoggedIn">
          <button class="text-gray-600 hover:text-gray-800 mr-4">Log In</button>
          <button class="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600">Sign Up</button>
        </template>
        <template v-else>
          <button class="bg-green-500 text-white rounded-full px-4 py-2 hover:bg-green-600 mr-4">Post a Deal</button>
          <button class="text-gray-600 hover:text-gray-800 mr-4">
            <i class="fas fa-user-circle text-xl"></i>
          </button>
          <button class="text-gray-600 hover:text-gray-800 mr-4">
            <i class="fas fa-bell text-xl"></i>
          </button>
        </template>
        <button @click="toggleLogin" class="ml-4 bg-gray-200 text-gray-700 rounded-full px-4 py-2 hover:bg-gray-300">
          Toggle Login
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  data() {
    return {
      isLoggedIn: false
    }
  },
  methods: {
    toggleLogin() {
      this.isLoggedIn = !this.isLoggedIn
    }
  }
}
</script>
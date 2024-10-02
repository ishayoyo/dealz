<!-- pages/admin/dashboard.vue -->
<template>
    <div class="container mx-auto px-4 py-8 pt-24">
      <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Users Section -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-2xl font-semibold mb-4">Users</h2>
          <div v-if="loadingUsers" class="text-center py-4">Loading users...</div>
          <div v-else-if="users.length === 0" class="text-center py-4">No users found</div>
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="user in users" :key="user._id" class="py-4 flex justify-between items-center">
              <div>
                <p class="font-medium">{{ user.username }}</p>
                <p class="text-sm text-gray-500">{{ user.email }}</p>
              </div>
              <button @click="deleteUser(user._id)" class="text-red-600 hover:text-red-800">
                Delete
              </button>
            </li>
          </ul>
        </div>
  
        <!-- Deals Section -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-2xl font-semibold mb-4">Deals</h2>
          <div v-if="loadingDeals" class="text-center py-4">Loading deals...</div>
          <div v-else-if="deals.length === 0" class="text-center py-4">No deals found</div>
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="deal in deals" :key="deal._id" class="py-4 flex justify-between items-center">
              <div>
                <p class="font-medium">{{ deal.title }}</p>
                <p class="text-sm text-gray-500">${{ deal.price }}</p>
              </div>
              <button @click="deleteDeal(deal._id)" class="text-red-600 hover:text-red-800">
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useAuthStore } from '~/stores/auth';
  import { useToastification } from '~/composables/useToastification';
  import api from '~/services/api';
  
  const authStore = useAuthStore();
  const toast = useToastification();
  
  const users = ref([]);
  const deals = ref([]);
  const loadingUsers = ref(true);
  const loadingDeals = ref(true);
  
  onMounted(async () => {
    if (!authStore.isAuthenticated || authStore.user.role !== 'admin') {
      // Redirect non-admin users
      navigateTo('/');
      return;
    }
  
    await fetchUsers();
    await fetchDeals();
  });
  
  async function fetchUsers() {
    try {
      const response = await api.get('/admin/users');
      users.value = response.data.data.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      loadingUsers.value = false;
    }
  }
  
  async function fetchDeals() {
    try {
      const response = await api.get('/admin/deals');
      deals.value = response.data.data.deals;
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch deals');
    } finally {
      loadingDeals.value = false;
    }
  }
  
  async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
  
    try {
      await api.delete(`/admin/users/${userId}`);
      users.value = users.value.filter(user => user._id !== userId);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  }
  
  async function deleteDeal(dealId) {
    if (!confirm('Are you sure you want to delete this deal?')) return;
  
    try {
      await api.delete(`/admin/deals/${dealId}`);
      deals.value = deals.value.filter(deal => deal._id !== dealId);
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    }
  }
  </script>
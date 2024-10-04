<!-- pages/admin/dashboard.vue -->
<template>
  <div class="container mx-auto px-4 py-8 pt-24">
    <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Users Section -->
      <div class="bg-white shadow-md rounded-lg p-6">
        <h2 class="text-2xl font-semibold mb-4">Users</h2>
        <div v-if="loadingUsers" class="text-center py-4">Loading users...</div>
        <div v-else-if="users.length === 0" class="text-center py-4">No users found</div>
        <ul v-else class="divide-y divide-gray-200">
          <li v-for="user in users" :key="user._id" class="py-4 flex items-center space-x-4">
            <div class="flex-grow min-w-0">
              <p class="font-medium truncate">{{ user.username }}</p>
              <p class="text-sm text-gray-500 truncate">{{ user.email }}</p>
            </div>
            <button @click="deleteUser(user._id)" class="text-red-600 hover:text-red-800 flex-shrink-0">
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
        <div v-else>
          <!-- Mobile view -->
          <div class="lg:hidden space-y-4">
            <div v-for="deal in deals" :key="deal._id" class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center space-x-4 mb-2">
                <img 
                  v-if="deal.imageUrl" 
                  :src="getImageUrl(deal.imageUrl)" 
                  alt="Deal image" 
                  class="h-20 w-20 object-cover rounded" 
                  @click="openImageModal(getImageUrl(deal.imageUrl))"
                >
                <div v-else class="h-20 w-20 bg-gray-200 rounded flex items-center justify-center text-gray-400">No image</div>
                <div>
                  <h3 class="font-semibold">{{ deal.title }}</h3>
                  <p class="text-sm text-gray-600">${{ deal.price }}</p>
                  <p class="text-sm text-gray-600">Status: {{ deal.status }}</p>
                </div>
              </div>
              <div class="flex justify-end space-x-2">
                <template v-if="deal.status === 'pending'">
                  <button @click="moderateDeal(deal._id, 'approved')" class="bg-green-500 text-white px-2 py-1 rounded text-sm">
                    Approve
                  </button>
                  <button @click="moderateDeal(deal._id, 'rejected')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">
                    Reject
                  </button>
                </template>
                <button v-else @click="deleteDeal(deal._id)" class="text-red-600 hover:text-red-800 text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop view -->
          <div class="hidden lg:block overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="deal in deals" :key="deal._id">
                  <td class="px-6 py-4 whitespace-nowrap">{{ deal.title }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">${{ deal.price }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ deal.status }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <img 
                      v-if="deal.imageUrl" 
                      :src="getImageUrl(deal.imageUrl)" 
                      alt="Deal image" 
                      class="h-20 w-20 object-cover rounded" 
                      @click="openImageModal(getImageUrl(deal.imageUrl))"
                    >
                    <span v-else>No image</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div v-if="deal.status === 'pending'">
                      <button @click="moderateDeal(deal._id, 'approved')" class="bg-green-500 text-white px-2 py-1 rounded mr-2">
                        Approve
                      </button>
                      <button @click="moderateDeal(deal._id, 'rejected')" class="bg-red-500 text-white px-2 py-1 rounded">
                        Reject
                      </button>
                    </div>
                    <button v-else @click="deleteDeal(deal._id)" class="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeImageModal">
      <div class="bg-white p-4 rounded-lg max-w-3xl max-h-3xl" @click.stop>
        <img :src="selectedImage" alt="Full size deal image" class="max-w-full max-h-full object-contain">
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useToastification } from '~/composables/useToastification';
import { useRuntimeConfig } from '#app';
import api from '~/services/api';

const authStore = useAuthStore();
const toast = useToastification();

const users = ref([]);
const deals = ref([]);
const loadingUsers = ref(true);
const loadingDeals = ref(true);

const config = useRuntimeConfig();

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-deal-image.jpg';
  return imageUrl.startsWith('http') 
    ? imageUrl 
    : `${getImageBaseUrl()}${imageUrl}`;
};

const getImageBaseUrl = () => {
  return config.public.apiBase.includes('localhost') 
    ? 'http://localhost:5000' 
    : 'https://deals.ishay.me';
};

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

const moderateDeal = async (dealId, status) => {
  try {
    await api.patch(`/admin/deals/${dealId}/moderate`, { status });
    await fetchDeals();
    toast.success(`Deal ${status} successfully`);
  } catch (error) {
    console.error('Error moderating deal:', error);
    toast.error('Failed to moderate deal');
  }
};

const openImageModal = (image) => {
  selectedImage.value = image;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
};

const selectedImage = ref('');
const showImageModal = ref(false);
</script>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Add a request interceptor to include the token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchDeals = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/deals`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

export const createDeal = async (dealData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals`, dealData);
    return response.data;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
};

export const updateDeal = async (dealId, dealData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/deals/${dealId}`, dealData);
    return response.data;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error;
  }
};

export const deleteDeal = async (dealId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/deals/${dealId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }
};

export const voteDeal = async (dealId, voteType) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals/${dealId}/vote`, { value: voteType });
    return response.data;
  } catch (error) {
    console.error('Error voting on deal:', error);
    throw error;
  }
};

export const markDealAsBought = async (dealId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals/${dealId}/buy`);
    return response.data;
  } catch (error) {
    console.error('Error marking deal as bought:', error);
    throw error;
  }
};

export const followDeal = async (dealId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals/${dealId}/follow`);
    return response.data;
  } catch (error) {
    console.error('Error following deal:', error);
    throw error;
  }
};

export const unfollowDeal = async (dealId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/deals/${dealId}/follow`);
    return response.data;
  } catch (error) {
    console.error('Error unfollowing deal:', error);
    throw error;
  }
};

export const fetchUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const fetchDealById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/deals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deal by ID:', error);
    throw error;
  }
};

export const fetchComments = async (dealId) => {
  try {
    console.log('Fetching comments for deal:', dealId);
    const response = await axios.get(`${API_BASE_URL}/deals/${dealId}/comments`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    console.log('Full API response:', JSON.stringify(response, null, 2));
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

export const addComment = async (dealId, content) => {
  try {
    console.log('Adding comment to deal:', dealId);
    const response = await axios.post(`${API_BASE_URL}/deals/${dealId}/comments`, 
      { content },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );
    console.log('Added comment:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const updateComment = async (dealId, commentId, content) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/deals/${dealId}/comments/${commentId}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (dealId, commentId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/deals/${dealId}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
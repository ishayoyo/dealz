import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const fetchDeals = async () => {
  const response = await fetch(`${API_BASE_URL}/deals`);
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
};

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/v1/users/login`, credentials);
  if (!response.data) throw new Error('Failed to login');
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/v1/users/register`, userData);
  if (!response.data) throw new Error('Failed to register user');
  return response.data;
};

// ... other API functions ...
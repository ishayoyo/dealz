import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/users';

export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Error signing up:', error);
    throw new Error(error.response?.data?.message || 'An unexpected error occurred during signup.');
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw new Error(error.response?.data?.message || 'An error occurred during login');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};
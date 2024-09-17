import axios from 'axios';
import { store } from '../redux/store';
import { setAuthenticated, setUser, logout as logoutAction } from '../redux/slices/authSlice';

const API_URL = 'http://localhost:5000/api/v1/users';

export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      store.dispatch(setAuthenticated(true));
      store.dispatch(setUser({ ...response.data.user, followedDeals: [], boughtDeals: [] }));
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
      store.dispatch(setAuthenticated(true));
      store.dispatch(setUser({ ...response.data.user, followedDeals: [], boughtDeals: [] }));
    }
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw new Error(error.response?.data?.message || 'An error occurred during login');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  store.dispatch(logoutAction());
};

export const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  if (token) {
    store.dispatch(setAuthenticated(true));
    // You might want to fetch user data here and dispatch setUser
  } else {
    store.dispatch(setAuthenticated(false));
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};
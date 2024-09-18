import axios from 'axios';
import { store } from '../redux/store';
import { login as loginAction, signup as signupAction, logout as logoutAction, setLoading, setError } from '../redux/slices/authSlice';

const API_URL = 'http://localhost:5000/api/v1/users';

export const login = async (credentials) => {
  try {
    store.dispatch(setLoading(true));
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      store.dispatch(loginAction(response.data));
    }
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'An error occurred during login';
    store.dispatch(setError(errorMessage));
    throw new Error(errorMessage);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const signup = async (userData) => {
  try {
    store.dispatch(setLoading(true));
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      store.dispatch(signupAction(response.data));
    }
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'An error occurred during signup';
    store.dispatch(setError(errorMessage));
    throw new Error(errorMessage);
  } finally {
    store.dispatch(setLoading(false));
  }
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  store.dispatch(logoutAction());
};

export const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      store.dispatch(setLoading(true));
      const response = await axios.get(`${API_URL}/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      store.dispatch(loginAction({ user: response.data.user, token }));
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      store.dispatch(logoutAction());
    } finally {
      store.dispatch(setLoading(false));
    }
  } else {
    store.dispatch(logoutAction());
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};
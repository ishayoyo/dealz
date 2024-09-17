import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import dealReducer from './slices/dealSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    deals: dealReducer,
  },
});
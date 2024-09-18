import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { thunk } from 'redux-thunk';  // Corrected import

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import dealReducer from './slices/dealSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: persistReducer({ key: 'user', storage }, userReducer),
  deals: dealReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(thunk),  // thunk is now correctly referenced
});

export const persistor = persistStore(store);
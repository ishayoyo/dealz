import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async () => {
    // Mock authenticated state
    return { isAuthenticated: true, user: { id: 1, name: 'Test User', followedDeals: [], boughtDeals: [] } };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: { followedDeals: [], boughtDeals: [] }, // Initialize with empty arrays
    loading: false,
    error: null,
  },
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = { followedDeals: [], boughtDeals: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        state.user = { ...state.user, ...action.payload.user };
        state.loading = false;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setAuthenticated, setUser, logout } = authSlice.actions;

export default authSlice.reducer;
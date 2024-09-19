// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUserProfile } from '../../utils/api';

export const fetchUserDeals = createAsyncThunk(
  'user/fetchUserDeals',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetchUserProfile(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'An error occurred');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    followedDeals: [],
    boughtDeals: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateUserDeals: (state, action) => {
      const { dealId, action: dealAction } = action.payload;
      if (dealAction === 'follow') {
        if (!state.followedDeals.includes(dealId)) {
          state.followedDeals.push(dealId);
        }
      } else if (dealAction === 'unfollow') {
        state.followedDeals = state.followedDeals.filter(id => id !== dealId);
      } else if (dealAction === 'bought') {
        if (!state.boughtDeals.includes(dealId)) {
          state.boughtDeals.push(dealId);
        }
      }
    },
    clearUserDeals: (state) => {
      state.followedDeals = [];
      state.boughtDeals = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDeals.fulfilled, (state, action) => {
        state.loading = false;
        state.followedDeals = action.payload.followedDeals || [];
        state.boughtDeals = action.payload.boughtDeals || [];
      })
      .addCase(fetchUserDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user deals';
      });
  },
});

export const { updateUserDeals, clearUserDeals } = userSlice.actions;
export default userSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDealById as fetchDealByIdApi } from '../../utils/api';

export const fetchDealById = createAsyncThunk(
  'deals/fetchDealById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchDealByIdApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  currentDeal: null,
  loading: false,
  error: null,
};

export const dealSlice = createSlice({
  name: 'deals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDealById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDealById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDeal = action.payload;
      })
      .addCase(fetchDealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dealSlice.reducer;
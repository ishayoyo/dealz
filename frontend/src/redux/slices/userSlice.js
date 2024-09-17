import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  followedDeals: [],
  boughtDeals: [],
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUserDeals: (state, action) => {
      const { dealId, action: dealAction } = action.payload;
      if (dealAction === 'follow') {
        state.followedDeals.push(dealId);
      } else if (dealAction === 'unfollow') {
        state.followedDeals = state.followedDeals.filter(id => id !== dealId);
      } else if (dealAction === 'bought') {
        state.boughtDeals.push(dealId);
      }
    },
  },
});

export const { updateUserDeals } = userSlice.actions;

export default userSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchDealById as fetchDealByIdApi, fetchComments as fetchCommentsApi, addComment as addCommentApi } from '../../utils/api';

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

export const fetchComments = createAsyncThunk(
  'deals/fetchComments',
  async (dealId, { rejectWithValue }) => {
    try {
      const response = await fetchCommentsApi(dealId);
      console.log('Fetched comments response in slice:', JSON.stringify(response, null, 2));
      
      let comments = [];
      if (Array.isArray(response)) {
        comments = response;
      } else if (response.data && Array.isArray(response.data)) {
        comments = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.comments)) {
        comments = response.data.data.comments;
      } else if (response.data && response.data.comments && Array.isArray(response.data.comments)) {
        comments = response.data.comments;
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Unexpected response structure');
      }
      
      console.log('Extracted comments:', comments);
      return { dealId, comments };
    } catch (error) {
      console.error('Error in fetchComments:', error);
      return rejectWithValue(error.message || 'An error occurred');
    }
  }
);

export const addComment = createAsyncThunk(
  'deals/addComment',
  async ({ dealId, content }, { rejectWithValue, getState }) => {
    try {
      const response = await addCommentApi(dealId, content);
      console.log('Add comment response:', JSON.stringify(response, null, 2));
      
      let comment;
      if (response.data?.comment) {
        comment = response.data.comment;
      } else if (response.data?.data?.comment) {
        comment = response.data.data.comment;
      } else {
        console.error('Unexpected response structure:', response);
        throw new Error('Unexpected response structure');
      }
      
      // Get the current user from the state
      const user = getState().auth.user;
      
      // Add user information to the comment
      comment.user = {
        _id: user.id,
        username: user.username,
        profilePicture: user.profilePicture
      };
      
      return { dealId, comment };
    } catch (error) {
      console.error('Error in addComment:', error);
      return rejectWithValue(error.message || 'An error occurred');
    }
  }
);

const initialState = {
  currentDeal: null,
  comments: {},
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
      })
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        const { dealId, comments } = action.payload;
        state.comments[dealId] = comments;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error('Failed to fetch comments:', action.payload);
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const { dealId, comment } = action.payload;
        if (!state.comments[dealId]) {
          state.comments[dealId] = [];
        }
        state.comments[dealId].unshift(comment);
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.payload;
        console.error('Failed to add comment:', action.payload);
      });
  },
});

export default dealSlice.reducer;
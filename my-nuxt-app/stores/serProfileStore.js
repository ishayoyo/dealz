import { defineStore } from 'pinia';
import axios from 'axios'; // Assuming you're using axios for API calls

export const useUserProfileStore = defineStore('userProfile', {
  state: () => ({
    profileData: null,
    followers: [],
    recentDeals: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    followerCount: (state) => state.followers.length,
    hasProfileData: (state) => !!state.profileData,
  },

  actions: {
    async fetchUserProfile(userId) {
      this.isLoading = true;
      try {
        const response = await axios.get(`/api/v1/users/profile/${userId}`);
        this.profileData = response.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUserFollowers(userId) {
      this.isLoading = true;
      try {
        const response = await axios.get(`/api/v1/users/${userId}/followers`);
        this.followers = response.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUserRecentDeals(userId) {
      this.isLoading = true;
      try {
        const response = await axios.get(`/api/v1/users/${userId}/recent-deals`);
        this.recentDeals = response.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
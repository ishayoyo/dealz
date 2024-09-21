// app/utils/api.server.ts
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/v1';

export async function fetchDeals() {
  try {
    const response = await axios.get(`${API_BASE_URL}/deals`);
    return response.data.data.deals;
  } catch (error) {
    console.error("Error fetching deals:", error);
    throw error;
  }
}

export async function fetchDealById(id: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/deals/${id}`);
    return response.data.data.deal;
  } catch (error) {
    console.error(`Error fetching deal ${id}:`, error);
    throw error;
  }
}

export async function createDeal(dealData: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals`, dealData);
    return response.data.data.deal;
  } catch (error) {
    console.error("Error creating deal:", error);
    throw error;
  }
}

export async function voteDeal(dealId: string, voteValue: number) {
  try {
    const response = await axios.post(`${API_BASE_URL}/deals/${dealId}/vote`, { value: voteValue });
    return response.data.data.deal;
  } catch (error) {
    console.error(`Error voting on deal ${dealId}:`, error);
    throw error;
  }
}
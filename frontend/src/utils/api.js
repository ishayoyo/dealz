const API_BASE_URL = 'http://localhost:5000/api';

export const fetchDeals = async () => {
  const response = await fetch(`${API_BASE_URL}/deals`);
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
};

// Add more API utility functions here
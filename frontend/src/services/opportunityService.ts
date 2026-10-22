import axios from 'axios';
import { CloseWonPayload, CloseLostPayload, ReopenPayload } from '../types/opportunity';

const API_URL = 'http://127.0.0.1:8000/api/v1/opportunities';

export const opportunityService = {
  closeWon: async (id: number, data: CloseWonPayload) => {
    const response = await axios.post(`${API_URL}/${id}/close-won`, data);
    return response.data;
  },

  closeLost: async (id: number, data: CloseLostPayload) => {
    const response = await axios.post(`${API_URL}/${id}/close-lost`, data);
    return response.data;
  },

  reopen: async (id: number, data: ReopenPayload) => {
    const response = await axios.post(`${API_URL}/${id}/reopen`, data);
    return response.data;
  }
};
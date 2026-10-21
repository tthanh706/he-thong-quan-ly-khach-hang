import api from '../api'; // Axios instance đã cấu hình JWT
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignListParams,
  CampaignPerformanceParams,
} from '../types/campaign';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedData<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const campaignService = {
  async getList(params?: CampaignListParams): Promise<PaginatedData<Campaign>> {
    const response = await api.get<ApiResponse<PaginatedData<Campaign>>>('/api/v1/campaigns', {
      params,
    });
    return response.data.data;
  },

  async getById(id: number): Promise<Campaign> {
    const response = await api.get<ApiResponse<Campaign>>(`/api/v1/campaigns/${id}`);
    return response.data.data;
  },

  async create(payload: CreateCampaignRequest): Promise<Campaign> {
    const response = await api.post<ApiResponse<Campaign>>('/api/v1/campaigns', payload);
    return response.data.data;
  },

  async update(id: number, payload: UpdateCampaignRequest): Promise<Campaign> {
    const response = await api.patch<ApiResponse<Campaign>>(`/api/v1/campaigns/${id}`, payload);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/v1/campaigns/${id}`);
  },

  async getPerformance(params?: CampaignPerformanceParams): Promise<PaginatedData<Campaign>> {
    const response = await api.get<ApiResponse<PaginatedData<Campaign>>>(
      '/api/v1/campaigns/performance',
      { params }
    );
    return response.data.data;
  },
};
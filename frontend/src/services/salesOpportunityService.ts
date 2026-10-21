import { api } from './api';
import type {
  SalesOpportunity,
  CreateOpportunityData,
  UpdateOpportunityData,
  OpportunityHistoryItem,
  FormOptionsData,
  StageConfig,
} from '../types/salesOpportunity';

export const salesOpportunityService = {
  /**
   * Lấy danh sách cơ hội bán hàng (kèm bộ lọc & phân trang)
   */
  async getOpportunities(params?: {
    search?: string;
    customer_id?: number | string;
    stage?: string;
    owner_user_id?: number | string;
    source?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.customer_id) query.append('customer_id', String(params.customer_id));
    if (params?.stage) query.append('stage', params.stage);
    if (params?.owner_user_id) query.append('owner_user_id', String(params.owner_user_id));
    if (params?.source) query.append('source', params.source);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_dir) query.append('sort_dir', params.sort_dir);
    if (params?.page) query.append('page', String(params.page));
    if (params?.per_page) query.append('per_page', String(params.per_page));

    const qs = query.toString();
    const res = await api<{
      success: boolean;
      data: { data: SalesOpportunity[]; total: number; current_page: number; last_page: number };
      meta?: { stages: Record<string, StageConfig> };
    }>(`/v1/sales-opportunities${qs ? `?${qs}` : ''}`);
    return res;
  },

  /**
   * Tạo mới cơ hội bán hàng (S5-01)
   */
  async createOpportunity(data: CreateOpportunityData) {
    const res = await api<{ success: boolean; message: string; data: SalesOpportunity }>(
      '/v1/sales-opportunities',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res;
  },

  /**
   * Chi tiết cơ hội
   */
  async getOpportunity(id: number) {
    const res = await api<{ success: boolean; data: SalesOpportunity }>(
      `/v1/sales-opportunities/${id}`
    );
    return res.data;
  },

  /**
   * Cập nhật cơ hội & ghi log lịch sử thay đổi (S6-01)
   */
  async updateOpportunity(id: number, data: UpdateOpportunityData) {
    const res = await api<{ success: boolean; message: string; data: SalesOpportunity }>(
      `/v1/sales-opportunities/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res;
  },

  /**
   * Xem toàn bộ lịch sử thay đổi của cơ hội (S6-01)
   */
  async getHistories(id: number) {
    const res = await api<{
      success: boolean;
      data: {
        opportunity: {
          id: number;
          name: string;
          stage: string;
          value: number;
          expected_close_date: string;
          win_probability: number;
        };
        histories: OpportunityHistoryItem[];
      };
    }>(`/v1/sales-opportunities/${id}/histories`);
    return res.data;
  },

  /**
   * Lấy danh sách giai đoạn chuẩn và xác suất mặc định
   */
  async getStages() {
    const res = await api<{ success: boolean; data: StageConfig[] }>(
      '/v1/sales-opportunities/stages'
    );
    return res.data;
  },

  /**
   * Lấy dữ liệu dropdown: danh sách khách hàng, nhân viên, giai đoạn, nguồn
   */
  async getFormOptions() {
    const res = await api<{ success: boolean; data: FormOptionsData }>(
      '/v1/sales-opportunities/options'
    );
    return res.data;
  },
};

import { api } from './api';
import type { WebForm, CreateWebFormData, PublicLeadSubmitPayload } from '../types/webForm';

export const webFormService = {
  /**
   * Danh sách web forms
   */
  async getForms(params?: { search?: string; is_active?: boolean | string; page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.is_active !== undefined && params.is_active !== '') {
      query.append('is_active', String(params.is_active));
    }
    if (params?.page) query.append('page', String(params.page));
    if (params?.per_page) query.append('per_page', String(params.per_page));

    const qs = query.toString();
    const res = await api<{ success: boolean; data: { data: WebForm[]; total: number; current_page: number; last_page: number } }>(
      `/v1/web-forms${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  /**
   * Tạo web form mới
   */
  async createForm(data: CreateWebFormData) {
    const res = await api<{ success: boolean; message: string; data: WebForm }>('/v1/web-forms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Xem chi tiết web form + mã nhúng & lead gần đây
   */
  async getFormDetail(id: number) {
    const res = await api<{ success: boolean; data: WebForm }>(`/v1/web-forms/${id}`);
    return res.data;
  },

  /**
   * Cập nhật form
   */
  async updateForm(id: number, data: Partial<CreateWebFormData>) {
    const res = await api<{ success: boolean; message: string; data: WebForm }>(`/v1/web-forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Xóa form
   */
  async deleteForm(id: number) {
    const res = await api<{ success: boolean; message: string }>(`/v1/web-forms/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  /**
   * Lấy mã nhúng
   */
  async getEmbedCode(id: number) {
    const res = await api<{
      success: boolean;
      data: {
        embed_token: string;
        submit_url: string;
        iframe_code: string;
        html_snippet: string;
      };
    }>(`/v1/web-forms/${id}/embed-code`);
    return res.data;
  },

  /**
   * Test submit lead công khai
   */
  async testSubmit(token: string, payload: PublicLeadSubmitPayload) {
    const res = await api<{
      success: boolean;
      message: string;
      data: { lead_id: number; form_code: string; created_at: string };
    }>(`/v1/public/web-forms/${token}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },
};

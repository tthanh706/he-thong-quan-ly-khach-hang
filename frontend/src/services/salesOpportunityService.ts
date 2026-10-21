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

  /**
   * S5-02: Bảng Pipeline Kanban (kèm thống kê tổng giá trị từng cột & cảnh báo đình trệ)
   */
  async getKanban(params?: {
    owner_user_id?: number | string;
    team_leader_id?: number | string;
    start_date?: string;
    end_date?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.owner_user_id) query.append('owner_user_id', String(params.owner_user_id));
    if (params?.team_leader_id) query.append('team_leader_id', String(params.team_leader_id));
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();

    const res = await api<{ success: boolean; data: any }>(
      `/v1/sales-opportunities/kanban${qs ? `?${qs}` : ''}`
    );
    const raw = res.data;

    if (Array.isArray(raw)) {
      const columns: Record<string, any> = {};
      let totalOpportunities = 0;
      let totalPipelineValue = 0;
      raw.forEach((stage: any) => {
        const items = stage.items ?? stage.opportunities ?? [];
        columns[stage.stage_key ?? stage.stage] = {
          stage: stage.stage_key ?? stage.stage,
          stage_name: stage.label ?? stage.stage_name ?? stage.stage_key,
          color: stage.color,
          probability: stage.probability ?? 0,
          count: stage.count ?? items.length,
          total_value: Number(stage.total_value ?? 0),
          opportunities: items,
        };
        totalOpportunities += stage.count ?? items.length;
        totalPipelineValue += Number(stage.total_value ?? 0);
      });
      return {
        columns,
        total_opportunities: totalOpportunities,
        total_pipeline_value: totalPipelineValue,
      };
    }

    return {
      columns: raw?.columns ?? {},
      total_opportunities: raw?.total_opportunities ?? 0,
      total_pipeline_value: raw?.total_pipeline_value ?? 0,
    };
  },

  /**
   * S5-02 & S5-04: Chuyển giai đoạn cơ hội (kiểm tra điều kiện bắt buộc / stage gates)
   */
  async changeStage(id: number, payload: {
    stage: string;
    override_stage_gates?: boolean;
    override_reason?: string;
  }) {
    return api<{ success: boolean; message: string; data: any; stage_gate_failed?: boolean }>(
      `/v1/sales-opportunities/${id}/stage`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-05: Đóng Thắng (Close Won) bắt buộc nhập giá trị chốt thực tế và ngày ký
   */
  async closeWon(id: number, payload: {
    actual_won_value: number;
    contract_signed_at: string;
    note?: string;
  }) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${id}/close-won`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-05: Đóng Thua (Close Lost) bắt buộc nhập lý do và đối thủ thắng thầu nếu có
   */
  async closeLost(id: number, payload: {
    loss_reason: string;
    competitor_name?: string;
    note?: string;
  }) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${id}/close-lost`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-05: Mở lại cơ hội đã đóng (chỉ Trưởng nhóm trở lên kèm lý do)
   */
  async reopen(id: number, payload: { reopen_reason: string }) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${id}/reopen`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-06: Dự báo doanh số tính theo trọng số xác suất (Weighted Forecast)
   */
  async getForecast(params?: { period?: string; user_id?: number }) {
    const q = new URLSearchParams();
    if (params?.period) q.append('period', params.period);
    if (params?.user_id) q.append('user_id', String(params.user_id));
    const qs = q.toString();

    const res = await api<{
      success: boolean;
      data: any;
    }>(`/v1/sales-opportunities/forecast${qs ? `?${qs}` : ''}`);
    const d = res.data ?? {};
    const p = d.periods ?? {};
    const mapPeriod = (x: any) => ({
      weighted_forecast: x?.weighted_forecast_value ?? x?.weighted_forecast ?? 0,
      pipeline: x?.raw_pipeline_value ?? x?.pipeline ?? 0,
      won: x?.actual_won ?? x?.won ?? 0,
      count: x?.count ?? 0,
    });
    return {
      ...d,
      this_month: d.this_month ?? mapPeriod(p.this_month),
      next_month: d.next_month ?? mapPeriod(p.next_month),
      this_quarter: d.this_quarter ?? mapPeriod(p.this_quarter),
      by_rep: (d.by_rep ?? []).map((r: any) => ({
        ...r,
        deal_count: r.deal_count ?? r.opportunity_count ?? 0,
        pipeline_value: r.pipeline_value ?? r.weighted_forecast ?? 0,
      })),
    } as any;
  },

  /**
   * S5-08: Phân bổ lại cơ hội hàng loạt (Bulk Reassign) kèm lý do bắt buộc
   */
  async bulkReassign(payload: {
    opportunity_ids: number[];
    new_owner_id: number;
    reason: string;
  }) {
    return api<{ success: boolean; message: string; data: any }>(
      '/v1/sales-opportunities/bulk-reassign',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-03: Danh sách sản phẩm & dịch vụ thuộc cơ hội
   */
  async getProducts(opportunityId: number) {
    const res = await api<{ success: boolean; data: any[] }>(
      `/v1/sales-opportunities/${opportunityId}/products`
    );
    return res.data;
  },

  /**
   * S5-03: Thêm sản phẩm dịch vụ vào cơ hội (tự tính lại tổng giá trị và ACV)
   */
  async addProduct(opportunityId: number, payload: any) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${opportunityId}/products`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S5-03: Xóa sản phẩm khỏi cơ hội
   */
  async removeProduct(opportunityId: number, itemId: number) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${opportunityId}/products/${itemId}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * S6-03: Danh sách thành viên cùng tham gia (Collaborators)
   */
  async getCollaborators(opportunityId: number) {
    const res = await api<{ success: boolean; data: any[] }>(
      `/v1/sales-opportunities/${opportunityId}/collaborators`
    );
    return res.data;
  },

  /**
   * S6-03: Chia sẻ cơ hội cho đồng nghiệp cùng theo
   */
  async addCollaborator(opportunityId: number, payload: { user_id: number; role_in_deal?: string }) {
    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${opportunityId}/collaborators`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * S6-03: Xóa quyền tham gia của thành viên
   */
  async removeCollaborator(opportunityId: number, collaboratorId: number) {
    return api<{ success: boolean; message: string }>(
      `/v1/sales-opportunities/${opportunityId}/collaborators/${collaboratorId}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * S6-04: Danh sách tài liệu đính kèm (Attachments)
   */
  async getAttachments(opportunityId: number) {
    const res = await api<{ success: boolean; data: any[] }>(
      `/v1/sales-opportunities/${opportunityId}/attachments`
    );
    return res.data;
  },

  /**
   * S6-04: Tải lên tài liệu đính kèm (tối đa 20MB)
   */
  async uploadAttachment(opportunityId: number, file: File, note?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (note) formData.append('note', note);

    return api<{ success: boolean; message: string; data: any }>(
      `/v1/sales-opportunities/${opportunityId}/attachments`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  /**
   * S6-04: Xóa tệp đính kèm
   */
  async deleteAttachment(opportunityId: number, attachmentId: number) {
    return api<{ success: boolean; message: string }>(
      `/v1/sales-opportunities/${opportunityId}/attachments/${attachmentId}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * S5-04: Danh sách điều kiện chuyển giai đoạn (Stage Gates)
   */
  async getStageGates() {
    const res = await api<{ success: boolean; data: any[] }>(
      '/v1/opportunity-stage-gates'
    );
    return res.data;
  },
};

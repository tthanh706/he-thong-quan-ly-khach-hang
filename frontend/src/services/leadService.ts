import { apiRequest } from '../api/client';
import type {
  AlertResponse,
  HistoryResponse,
  LeadListResponse,
  LeadStatus,
  SingleLeadResponse,
} from '../types/lead';

export interface LeadFilters {
  status?: LeadStatus | '';
  source?: string;
  rating?: string;
  assigned_to?: number;
  team_leader_id?: number;
  sla_overdue?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  per_page?: number;
}

function queryString(filters: LeadFilters): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.source) {
    params.set('source', filters.source);
  }
  if (filters.rating) {
    params.set('rating', filters.rating);
  }
  if (filters.assigned_to !== undefined) {
    params.set('assigned_to', String(filters.assigned_to));
  }
  if (filters.team_leader_id !== undefined) {
    params.set('team_leader_id', String(filters.team_leader_id));
  }
  if (filters.sla_overdue !== undefined) {
    params.set('sla_overdue', filters.sla_overdue ? '1' : '0');
  }
  if (filters.date_from) {
    params.set('date_from', filters.date_from);
  }
  if (filters.date_to) {
    params.set('date_to', filters.date_to);
  }
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.per_page !== undefined) {
    params.set('per_page', String(filters.per_page));
  }

  const value = params.toString();
  return value ? `?${value}` : '';
}

export const leadService = {
  getLeads(filters: LeadFilters = {}): Promise<LeadListResponse> {
    return apiRequest<LeadListResponse>(`/v1/leads${queryString(filters)}`);
  },

  getLead(id: number): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>(`/v1/leads/${id}`);
  },

  assign(id: number, assignedTo: number, teamLeaderId: number): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>(`/v1/leads/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        assigned_to: assignedTo,
        team_leader_id: teamLeaderId,
      }),
    });
  },

  accept(id: number): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>(`/v1/leads/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  reject(id: number, reason: string): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>(`/v1/leads/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  markContacted(id: number): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>(`/v1/leads/${id}/contact`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getHistory(id: number): Promise<HistoryResponse> {
    return apiRequest<HistoryResponse>(`/v1/leads/${id}/history`);
  },

  getSlaAlerts(): Promise<AlertResponse> {
    return apiRequest<AlertResponse>('/v1/leads/sla-alerts');
  },

  checkSla(): Promise<unknown> {
    return apiRequest<unknown>('/v1/leads/check-sla', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // S4-02: Tạo lead thủ công (bắt buộc có nguồn)
  createManual(payload: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source: string;
    industry?: string;
    company_size?: string;
    interest?: string;
    campaign_id?: number;
    notes?: string;
  }): Promise<SingleLeadResponse> {
    return apiRequest<SingleLeadResponse>('/v1/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // S4-02: Nhập lead hàng loạt từ Excel
  previewImport(file: File): Promise<{
    success: boolean;
    data: {
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      rows: Array<{
        row_number: number;
        is_valid: boolean;
        errors: string[];
        data: Record<string, any>;
      }>;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/v1/leads/import/preview', {
      method: 'POST',
      body: formData,
    });
  },

  confirmImport(rows: any[]): Promise<{
    success: boolean;
    data: { imported_count: number; errors_count: number };
    message: string;
  }> {
    return apiRequest('/v1/leads/import/confirm', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  // S4-04: Phát hiện trùng theo email, phone, company
  checkDuplicates(params: { email?: string; phone?: string; company?: string; exclude_lead_id?: number }): Promise<{
    success: boolean;
    data: {
      lead_duplicates: any[];
      customer_duplicates: any[];
      has_duplicate: boolean;
    };
  }> {
    const q = new URLSearchParams();
    if (params.email) q.set('email', params.email);
    if (params.phone) q.set('phone', params.phone);
    if (params.company) q.set('company', params.company);
    if (params.exclude_lead_id) q.set('exclude_lead_id', String(params.exclude_lead_id));
    return apiRequest(`/v1/leads/check-duplicates?${q.toString()}`);
  },

  // S4-04: Gộp lead trùng giữ nguyên lịch sử
  mergeLeads(primaryLeadId: number, secondaryLeadId: number): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    return apiRequest('/v1/leads/merge', {
      method: 'POST',
      body: JSON.stringify({
        primary_lead_id: primaryLeadId,
        secondary_lead_id: secondaryLeadId,
      }),
    });
  },

  // S4-08: Chuyển đổi lead 1-click thành Customer + Contact + Opportunity
  convertLead(leadId: number, payload: {
    customer_name?: string;
    tax_code?: string;
    address?: string;
    opportunity_name?: string;
    opportunity_value?: number;
    expected_close_date?: string;
    contact_title?: string;
    contact_department?: string;
  }): Promise<{
    success: boolean;
    data: {
      customer: any;
      contact: any;
      opportunity: any;
      lead: any;
    };
    message: string;
  }> {
    return apiRequest(`/v1/leads/${leadId}/convert`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // S4-05: Cấu hình chấm điểm lead
  getScoringRules(): Promise<{ success: boolean; data: any[] }> {
    return apiRequest('/v1/lead-scoring-rules');
  },

  saveScoringRule(payload: {
    criterion_type: string;
    criterion_value: string;
    points: number;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: any; message: string }> {
    return apiRequest('/v1/lead-scoring-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteScoringRule(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/v1/lead-scoring-rules/${id}`, {
      method: 'DELETE',
    });
  },

  // S4-06: Cấu hình quy tắc phân bổ lead tự động
  getAssignmentRules(): Promise<{ success: boolean; data: any[] }> {
    return apiRequest('/v1/lead-assignment-rules');
  },

  saveAssignmentRule(payload: {
    rule_name: string;
    priority: number;
    rule_type: string;
    condition_field?: string;
    condition_value?: string;
    target_user_id?: number;
    is_active?: boolean;
  }): Promise<{ success: boolean; data: any; message: string }> {
    return apiRequest('/v1/lead-assignment-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteAssignmentRule(id: number): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/v1/lead-assignment-rules/${id}`, {
      method: 'DELETE',
    });
  },
};

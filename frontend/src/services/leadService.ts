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
  assigned_to?: number;
  team_leader_id?: number;
  sla_overdue?: boolean;
  search?: string;
  per_page?: number;
}

function queryString(filters: LeadFilters): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
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
};

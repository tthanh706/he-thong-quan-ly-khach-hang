export type LeadStatus = 'waiting_assignment' | 'assigned' | 'caring';
export type LeadAction = 'assigned' | 'accepted' | 'rejected' | 'contacted' | 'sla_overdue';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  assigned_to: number | null;
  assigned_user?: UserSummary | null;
  team_leader_id: number | null;
  team_leader?: UserSummary | null;
  status: LeadStatus;
  assigned_at: string | null;
  accepted_at: string | null;
  contacted_at: string | null;
  sla_deadline: string | null;
  sla_flagged_at: string | null;
  is_sla_overdue: boolean;
  rejection_reason: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadHistory {
  id: number;
  lead_id: number;
  user: UserSummary | null;
  action: LeadAction;
  old_status: string | null;
  new_status: string | null;
  reason: string | null;
  created_at: string | null;
}

export interface SlaAlert {
  id: number;
  lead_id: number;
  lead?: {
    id: number;
    name: string;
    status: LeadStatus;
  } | null;
  recipient?: UserSummary | null;
  overdue_at: string;
  read_at: string | null;
  created_at: string | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LeadListResponse {
  success: boolean;
  data: Lead[];
  meta?: PaginationMeta;
  message?: string;
}

export interface SingleLeadResponse {
  success: boolean;
  data: Lead;
  message?: string;
}

export interface HistoryResponse {
  success: boolean;
  data: LeadHistory[];
  message?: string;
}

export interface AlertResponse {
  success: boolean;
  data: SlaAlert[];
  message?: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  success?: boolean;
  session_token?: string;
  token?: string;
  expires_at?: string;
  user?: CurrentUser;
  data?: {
    session_token?: string;
    token?: string;
    expires_at?: string;
    user?: CurrentUser;
  };
  message?: string;
}

export interface MeResponse {
  success?: boolean;
  data?: CurrentUser;
  user?: CurrentUser;
}

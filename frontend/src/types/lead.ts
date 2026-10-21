export type LeadStatus =
  | 'new'
  | 'waiting_assignment'
  | 'assigned'
  | 'caring'
  | 'contacted'
  | 'converted'
  | 'merged'
  | 'rejected'
  | string;

export type LeadAction = 'created' | 'assigned' | 'accepted' | 'rejected' | 'contacted' | 'sla_overdue' | 'converted' | 'merged' | string;

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
  company?: string | null;
  source: string;
  interest?: string | null;
  industry?: string | null;
  company_size?: string | null;
  score?: number;
  rating?: 'hot' | 'warm' | 'cold' | string;
  assigned_to: number | null;
  assigned_user?: UserSummary | null;
  team_leader_id: number | null;
  team_leader?: UserSummary | null;
  campaign_id?: number | null;
  campaign?: { id: number; name: string } | null;
  status: LeadStatus;
  assigned_at: string | null;
  accepted_at: string | null;
  contacted_at: string | null;
  sla_deadline: string | null;
  sla_flagged_at: string | null;
  is_sla_overdue: boolean;
  rejection_reason: string | null;
  converted_at?: string | null;
  converted_customer_id?: number | null;
  convertedCustomer?: { id: number; name: string } | null;
  is_merged?: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface LeadScoringRule {
  id: number;
  criterion_type: 'industry' | 'company_size' | 'source' | 'interest';
  criterion_value: string;
  points: number;
  is_active: boolean;
  created_at?: string;
}

export interface LeadAssignmentRule {
  id: number;
  rule_name: string;
  priority: number;
  rule_type: 'region' | 'industry' | 'round_robin';
  condition_field?: string | null;
  condition_value?: string | null;
  target_user_id?: number | null;
  target_user?: UserSummary | null;
  is_active: boolean;
}

export interface DuplicateLeadCheck {
  lead_duplicates: Array<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    status: string;
    created_at: string;
  }>;
  customer_duplicates: Array<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  }>;
  has_duplicate: boolean;
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

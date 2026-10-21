// ─── Lead Types & Interfaces ────────────────────────────────────
// S4-04: Lead Deduplication - Frontend Type Definitions

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'merged';

export type ActivityLogType = 'note' | 'call' | 'email' | 'meeting' | 'task' | 'status_change' | 'merge';

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  job_title: string | null;
  source: string | null;
  status: LeadStatus;
  assigned_to: number | null;
  assigned_user: AssignedUser | null;
  linked_customer_id: number | null;
  linked_customer: LinkedCustomer | null;
  merged_into_lead_id: number | null;
  custom_fields: Record<string, unknown> | null;
  notes: string | null;
  activity_logs_count?: number;
  activity_logs?: LeadActivityLog[];
  created_at: string;
  updated_at: string;
}

export interface AssignedUser {
  id: number;
  name: string;
}

export interface LinkedCustomer {
  id: number;
  company_name: string;
  email: string | null;
}

export interface LeadActivityLog {
  id: number;
  lead_id: number;
  type: ActivityLogType;
  subject: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_by: number;
  creator?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MatchingCustomer {
  id: number;
  company_name: string;
  email: string | null;
  phone_number: string | null;
}

export interface DuplicateCheckResult {
  lead_id: number;
  has_duplicates: boolean;
  duplicate_leads: Lead[];
  has_matching_customers: boolean;
  matching_customers: MatchingCustomer[];
  suggestion: string;
}

export interface CreateLeadPayload {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  company_name?: string;
  job_title?: string;
  source?: string;
  status?: LeadStatus;
  assigned_to?: number;
  custom_fields?: Record<string, unknown>;
  notes?: string;
}

export interface MergeLeadPayload {
  primary_lead_id: number;
  secondary_lead_id: number;
  merge_reason?: string;
}

export interface LinkLeadToCustomerPayload {
  customer_id: number;
}

export interface CreateLeadResponse {
  data: Lead;
  warning: DuplicateCheckResult | null;
}

export interface MergeLeadResponse {
  message: string;
  data: Lead;
}

export interface LinkLeadResponse {
  message: string;
  data: Lead;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface LeadListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: LeadStatus;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

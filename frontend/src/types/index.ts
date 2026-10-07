export type Permission =
  | 'dashboard.view'
  | 'customers.view'
  | 'customers.create'
  | 'customers.update'
  | 'customers.delete'
  | 'campaigns.view'
  | 'campaigns.create'
  | 'campaigns.update'
  | 'campaigns.delete'
  | 'reports.view'
  | 'users.manage';

export type UserRole = 'admin' | 'manager' | 'staff' | 'SALES_REP' | 'TEAM_LEADER' | 'SALES_DIRECTOR' | string;
export type DataScope = 'MINE' | 'TEAM' | 'ALL';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
  status?: string;
  is_active?: boolean;
  locked_at?: string | null;
  phone?: string | null;
  job_title?: string | null;
  email_signature?: string | null;
  avatar_url?: string | null;
  scope?: DataScope;
  business_group_id?: number | null;
  businessGroup?: { id: number | null; name: string | null };
  permissions?: Permission[];
  customers_count?: number;
  opportunities_count?: number;
  created_at?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: { token: string; user: User };
  message: string;
}

export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive';

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  status?: CustomerStatus | string;
  assigned_to?: number | null;
  owner_id?: number | null;
  owner?: User;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  assigned_user?: User;
}

export interface CustomerPayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  status?: CustomerStatus | string;
  assigned_to?: number;
  notes?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | string | '';
  assigned_to?: number | '';
  per_page?: number;
  page?: number;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  status?: CampaignStatus | string;
  starts_at?: string | null;
  ends_at?: string | null;
  budget?: string | number | null;
  created_by?: number;
  customer_id?: number | null;
  created_at?: string;
  updated_at?: string;
  creator?: User;
  customer?: Customer;
}

export interface CampaignPayload {
  name: string;
  description?: string;
  status?: CampaignStatus | string;
  starts_at?: string;
  ends_at?: string;
  budget?: number;
  customer_id?: number;
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus | string | '';
  per_page?: number;
  page?: number;
}

export interface Opportunity {
  id: number;
  title: string;
  name?: string;
  amount: string;
  status: string;
  owner: User;
}

export interface HandoverLog {
  id: number;
  source_user_id: number;
  target_user_id: number;
  performed_by_user_id: number;
  entity_type: 'customer' | 'opportunity';
  entity_id: number;
  handed_over_at: string;
  source_user: User;
  target_user: User;
  performed_by?: User;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
}

export interface BusinessGroup {
  id: number;
  name: string;
  parent_id?: number | null;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  business_groups: BusinessGroup[];
}

export interface AssignmentOptions {
  roles: Role[];
  business_groups: BusinessGroup[];
}

export interface ScopedRecord {
  id: number;
  name: string;
  status?: string | null;
  value?: number | null;
  description?: string | null;
  owner_id: number;
  business_group_id: number;
  ownerName?: string | null;
}

export interface ErrorAction {
  label: string;
  url: string;
}

export interface ApiError {
  status_code: number;
  title: string;
  message: string;
  primary_action: ErrorAction;
  secondary_action: ErrorAction | null;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuditLogItem {
  id: number;
  username: string;
  action: string;
  targetModule: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface CustomFieldItem {
  id: number;
  module: 'Customer' | 'Opportunity';
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Select';
  isRequired: boolean;
}

export * from './auditLog';
export * from './customField';

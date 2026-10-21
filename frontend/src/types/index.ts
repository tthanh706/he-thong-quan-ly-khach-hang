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
  lock_reason?: string | null;
  phone?: string | null;
  job_title?: string | null;
  email_signature?: string | null;
  avatar_url?: string | null;
  scope?: DataScope;
  business_group_id?: number | null;
  businessGroup?: { id: number | null; name: string | null };
  roles?: Role[];
  business_groups?: BusinessGroup[];
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

export type CustomerStatus = 'Tiềm năng' | 'Đang giao dịch' | 'Khách hàng' | 'Ngừng hợp tác' | 'lead' | 'prospect' | 'active' | 'inactive' | string;

export interface Customer {
  id: number | string;
  code?: string;
  name: string;
  tax_code?: string | null;
  taxCode?: string | null;
  industry?: string | null;
  company_size?: string | null;
  scale?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  area?: string | null;
  company?: string | null;
  status?: CustomerStatus;
  tier?: string;
  assigned_to?: number | null;
  owner_id?: number | null;
  ownerId?: number | null;
  owner?: User;
  ownerName?: string;
  parent_id?: number | null;
  parentId?: number | null;
  parentName?: string;
  notes?: string | null;
  contacts?: Array<{
    id: string;
    name: string;
    phone?: string;
    email?: string;
    title?: string;
    is_primary?: boolean;
  }>;
  contactsCount?: number;
  contractsCount?: number;
  supportRequestsCount?: number;
  periodicCaresCount?: number;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  assigned_user?: User;
}

export interface CustomerPayload {
  name: string;
  code?: string;
  tax_code?: string;
  taxCode?: string;
  industry?: string;
  company_size?: string;
  scale?: string;
  website?: string;
  address?: string;
  area?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: CustomerStatus;
  tier?: string;
  owner_id?: number;
  ownerId?: number;
  assigned_to?: number;
  parent_id?: number | null;
  parentId?: number | null;
  notes?: string;
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | '';
  industry?: string | '';
  company_size?: string | '';
  scale?: string | '';
  area?: string | '';
  owner_id?: number | '';
  assigned_to?: number | '';
  contact_phone?: string;
  has_parent?: boolean | '';
  per_page?: number;
  page?: number;
}

export interface SavedFilterItem {
  id: number;
  name: string;
  module: string;
  filters: CustomerFilters;
  created_at?: string;
}

export interface CustomerFilterOptions {
  statuses: string[];
  company_sizes: string[];
  industries: string[];
  areas: string[];
  owners: Array<{ id: number; name: string; email: string; role?: string }>;
  current_user?: {
    id: number;
    name: string;
    role?: string;
    data_scope?: string;
  };
}


export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  channel?: string | null;
  status?: CampaignStatus | string;
  starts_at?: string | null;
  ends_at?: string | null;
  budget?: string | number | null;
  target_leads?: number | null;
  target_revenue?: number | null;
  lead_count?: number;
  opportunity_count?: number;
  won_value?: number;
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
  channel?: string;
  status?: CampaignStatus | string;
  starts_at?: string;
  ends_at?: string;
  budget?: number;
  target_leads?: number;
  target_revenue?: number;
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
export * from './crm';

export interface Contact {
  id: string;
  name: string;
  full_name?: string;
  title?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  companyId?: string;
  customer_id?: number | string;
  companyName?: string;
  customer?: { id: number; name: string };
  department?: string;
  isPrimary?: boolean;
  is_primary?: boolean;
  roleInDecision?: string;
  decision_role?: string;
  notes?: string;
}

export interface ContactHistory {
  id: number | string;
  contact_id?: number | string;
  old_customer_id?: number | string;
  new_customer_id?: number | string;
  oldCustomerId?: number | string;
  newCustomerId?: number | string;
  oldCustomerName?: string;
  newCustomerName?: string;
  old_customer?: { id: number; name: string };
  new_customer?: { id: number; name: string };
  changed_by?: { id: number; name: string };
  changed_at?: string;
  changedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  taxCode?: string;
  industry?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status?: string;
  tier?: string;
  totalRevenue?: number;
}

export interface Subsidiary {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  tier: string;
  totalContracts?: number;
}

export interface ParentCompany {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  tier: string;
  subsidiaries: Subsidiary[];
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  can_view_opportunity_financials?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type {
  Contract,
  ContractAlert,
  ContractStatus,
  ExpiryAlert,
  ExpirySetting,
  RenewalOpportunity,
} from './contractRenewal';

export type {
  TeamMember,
  PerformanceMember,
  PerformanceSummary,
  PerformanceReport,
} from './teamPerformance';

export type {
  OpportunityExportData,
  OpportunityFilterData,
  OpportunityFilters,
  OpportunityRow,
  FilterOptionOwner,
} from './opportunityExport';



export interface StageConfig {
  key: string;
  label: string;
  probability: number;
  color: string;
}

export interface OpportunityContact {
  id: number;
  customer_id?: number;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  is_primary?: boolean;
}

export interface OpportunityCustomer {
  id: number;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  contacts?: OpportunityContact[];
}

export interface OpportunityOwner {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface OpportunityHistoryItem {
  id: number;
  opportunity_id: number;
  field_name: string;
  field_label: string;
  old_value?: string;
  new_value?: string;
  old_label?: string;
  new_label?: string;
  changed_by_user_id?: number;
  changed_by_user?: {
    id: number;
    name: string;
    email: string;
  };
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOpportunity {
  id: number;
  name: string;
  title?: string;
  customer_id: number;
  contact_id?: number;
  stage: string;
  status: 'open' | 'won' | 'lost';
  value: number;
  amount?: number;
  expected_close_date: string;
  source?: string;
  win_probability: number;
  win_probability_customized: boolean;
  probability_note?: string;
  owner_user_id?: number;
  owner_id?: number;
  notes?: string;
  last_activity_at?: string;
  customer?: OpportunityCustomer;
  contact?: OpportunityContact;
  owner?: OpportunityOwner;
  team_leader?: OpportunityOwner;
  histories?: OpportunityHistoryItem[];
  histories_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOpportunityData {
  name: string;
  customer_id: number;
  contact_id?: number;
  stage: string;
  value: number;
  expected_close_date: string;
  source?: string;
  win_probability?: number;
  probability_note?: string;
  owner_user_id?: number;
  notes?: string;
}

export interface UpdateOpportunityData {
  name?: string;
  customer_id?: number;
  contact_id?: number;
  stage?: string;
  value?: number;
  expected_close_date?: string;
  source?: string;
  win_probability?: number;
  probability_note?: string;
  owner_user_id?: number;
  notes?: string;
  change_reason?: string;
}

export interface FormOptionsData {
  customers: OpportunityCustomer[];
  users: OpportunityOwner[];
  stages: StageConfig[];
  sources: string[];
}

export interface OpportunityProductItem {
  id: number;
  opportunity_id: number;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  is_subscription: boolean;
  subscription_billing_cycle?: string | null;
  subscription_duration_months?: number | null;
  annual_contract_value?: number | null;
}

export interface OpportunityCollaboratorItem {
  id: number;
  opportunity_id: number;
  user_id: number;
  user?: OpportunityOwner;
  role_in_deal?: string;
  created_at?: string;
}

export interface OpportunityAttachmentItem {
  id: number;
  opportunity_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  uploaded_by: number;
  uploader?: OpportunityOwner;
  created_at: string;
}

export interface StageGateItem {
  id: number;
  from_stage: string;
  to_stage: string;
  gate_name: string;
  description?: string;
  min_activities_required: number;
  min_meetings_required: number;
  requires_contact_person: boolean;
  requires_product_selected: boolean;
  is_active: boolean;
}

export interface KanbanColumn {
  stage: string;
  stage_name: string;
  color: string;
  probability: number;
  count: number;
  total_value: number;
  opportunities: SalesOpportunity[];
}

export interface ForecastRepSummary {
  user_id: number;
  user_name: string;
  email: string;
  pipeline_value: number;
  weighted_forecast: number;
  actual_won: number;
  target: number;
  deal_count: number;
}

export interface ForecastData {
  this_month: { pipeline: number; weighted_forecast: number; won: number; target: number };
  next_month: { pipeline: number; weighted_forecast: number; won: number; target: number };
  this_quarter: { pipeline: number; weighted_forecast: number; won: number; target: number };
  by_rep: ForecastRepSummary[];
}

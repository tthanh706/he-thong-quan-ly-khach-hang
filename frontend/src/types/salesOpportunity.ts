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

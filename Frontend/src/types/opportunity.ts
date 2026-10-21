export type OpportunityStatus = 'open' | 'won' | 'lost';
export type AlertType = 'stagnant' | 'overdue_close';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface Opportunity {
  id: number;
  name: string;
  owner_user_id: number | null;
  owner: UserSummary | null;
  team_leader_id: number | null;
  team_leader: UserSummary | null;
  stage: string;
  status: OpportunityStatus;
  value: string | number;
  expected_close_date: string | null;
  last_activity_at: string | null;
  stagnation_flagged_at: string | null;
  overdue_close_flagged_at: string | null;
  has_stagnation_warning: boolean;
  has_overdue_close_warning: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface OpportunityAlert {
  id: number;
  type: AlertType;
  message: string;
  detected_at: string | null;
  read_at: string | null;
  opportunity: {
    id: number;
    name: string;
    stage: string;
    status: OpportunityStatus;
    expected_close_date: string | null;
  } | null;
  recipient: UserSummary | null;
}

export interface StageConfig {
  id: number;
  stage: string;
  inactivity_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id: number;
  opportunity_id: number;
  type: string;
  note: string | null;
  activity_at: string | null;
  user: UserSummary | null;
  created_at: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: UserSummary;
  session_token: string;
  expires_at: string;
  redirect: string;
}

export interface CheckResult {
  stagnant_count: number;
  overdue_close_count: number;
  total_flagged: number;
}

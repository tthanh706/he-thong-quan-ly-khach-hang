import { apiRequest } from '../api/client';
import type {
  Activity,
  ApiResponse,
  CheckResult,
  LoginResponse,
  Opportunity,
  OpportunityAlert,
  StageConfig,
  UserSummary,
} from '../types/opportunity';

export interface OpportunityFilters {
  status?: string;
  stage?: string;
  search?: string;
  onlyProblem?: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser(): Promise<ApiResponse<UserSummary>> {
  return apiRequest<ApiResponse<UserSummary>>('/me');
}

export async function logout(): Promise<void> {
  await apiRequest<ApiResponse<null>>('/logout', { method: 'POST' });
  localStorage.removeItem('session_token');
  localStorage.removeItem('current_user');
}

export async function getOpportunities(filters: OpportunityFilters = {}): Promise<ApiResponse<Opportunity[]>> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.search) params.set('search', filters.search);
  if (filters.onlyProblem !== undefined) params.set('only_problem', filters.onlyProblem ? '1' : '0');
  const query = params.toString();
  return apiRequest<ApiResponse<Opportunity[]>>(`/v1/opportunities${query ? `?${query}` : ''}`);
}

export async function getProblemOpportunities(): Promise<ApiResponse<Opportunity[]>> {
  return apiRequest<ApiResponse<Opportunity[]>>('/v1/opportunities/problem-list');
}

export async function getAlerts(): Promise<ApiResponse<OpportunityAlert[]>> {
  return apiRequest<ApiResponse<OpportunityAlert[]>>('/v1/opportunities/stagnation-alerts');
}

export async function checkStagnation(): Promise<ApiResponse<CheckResult>> {
  return apiRequest<ApiResponse<CheckResult>>('/v1/opportunities/check-stagnation', {
    method: 'POST',
  });
}

export async function getStageConfigs(): Promise<ApiResponse<StageConfig[]>> {
  return apiRequest<ApiResponse<StageConfig[]>>('/v1/opportunity-stage-configs');
}

export async function updateStageConfig(
  id: number,
  inactivityDays: number,
  isActive: boolean
): Promise<ApiResponse<StageConfig>> {
  return apiRequest<ApiResponse<StageConfig>>(`/v1/opportunity-stage-configs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ inactivity_days: inactivityDays, is_active: isActive }),
  });
}

export async function addActivity(
  opportunityId: number,
  type: string,
  note: string,
  activityAt?: string
): Promise<ApiResponse<Activity>> {
  return apiRequest<ApiResponse<Activity>>(`/v1/opportunities/${opportunityId}/activities`, {
    method: 'POST',
    body: JSON.stringify({
      type,
      note: note || null,
      activity_at: activityAt || null,
    }),
  });
}

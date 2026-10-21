export type CalendarView = 'day' | 'week' | 'month';
export type CalendarItemType = 'meeting' | 'task';
export type CalendarItemStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface CalendarItem {
  id: number;
  title: string;
  item_type: CalendarItemType;
  status: CalendarItemStatus;
  priority?: 'low' | 'medium' | 'high';
  postpone_reason?: string | null;
  assigned_user_id: number | null;
  assigned_user: UserSummary | null;
  team_leader_id: number | null;
  team_leader: UserSummary | null;
  start_at: string | null;
  end_at: string | null;
  due_at: string | null;
  location: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
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

export interface MeetingPayload {
  assigned_user_id: number;
  team_leader_id: number;
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  description?: string;
}

export interface TaskPayload {
  assigned_user_id: number;
  team_leader_id: number;
  title: string;
  due_at: string;
  description?: string;
}

import { apiRequest } from '../api/client';
import type {
  ApiResponse,
  CalendarItem,
  CalendarView,
  LoginResponse,
  MeetingPayload,
  TaskPayload,
  UserSummary,
} from '../types/calendar';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(): Promise<ApiResponse<UserSummary>> {
  return apiRequest<ApiResponse<UserSummary>>('/me');
}

export async function logout(): Promise<void> {
  await apiRequest<ApiResponse<null>>('/logout', { method: 'POST' });
  localStorage.removeItem('session_token');
}

function query(view: CalendarView, date: string): string {
  const params = new URLSearchParams({ view, date });
  return params.toString();
}

export function getMyCalendar(view: CalendarView, date: string): Promise<ApiResponse<CalendarItem[]>> {
  return apiRequest<ApiResponse<CalendarItem[]>>(`/v1/calendar/my?${query(view, date)}`);
}

export function getTeamCalendar(view: CalendarView, date: string): Promise<ApiResponse<CalendarItem[]>> {
  return apiRequest<ApiResponse<CalendarItem[]>>(`/v1/calendar/team?${query(view, date)}`);
}

export function getCalendarUsers(): Promise<ApiResponse<UserSummary[]>> {
  return apiRequest<ApiResponse<UserSummary[]>>('/v1/calendar/users');
}

export function createMeeting(payload: MeetingPayload): Promise<ApiResponse<CalendarItem>> {
  return apiRequest<ApiResponse<CalendarItem>>('/v1/calendar/meetings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createTask(payload: TaskPayload): Promise<ApiResponse<CalendarItem>> {
  return apiRequest<ApiResponse<CalendarItem>>('/v1/calendar/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

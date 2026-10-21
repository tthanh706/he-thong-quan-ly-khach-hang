import { api } from './api';

export interface ActivityItem {
  id: number;
  user_id: number;
  customer_id?: number;
  contact_id?: number;
  opportunity_id?: number;
  lead_id?: number;
  activity_type: 'call' | 'meeting' | 'email' | 'note' | 'quotation';
  title: string;
  description?: string;
  duration_minutes?: number;
  result?: string;
  call_result?: string;
  callback_at?: string;
  occurred_at: string;
  user?: { id: number; name: string; email: string };
  customer?: { id: number; name: string; code: string };
  contact?: { id: number; name: string; phone?: string; email?: string };
  opportunity?: { id: number; name: string; stage?: string };
  lead?: { id: number; name: string; company?: string };
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled';
  due_at: string;
  completed_at?: string;
  postpone_reason?: string;
  assigned_user_id: number;
  customer_id?: number;
  opportunity_id?: number;
  assigned_user?: { id: number; name: string; email: string };
  team_leader?: { id: number; name: string; email: string };
  customer?: { id: number; name: string; code?: string };
  opportunity?: { id: number; name: string; stage?: string };
}

export interface CustomerTimelineEvent {
  id: string;
  event_type: 'activity' | 'stage_change' | 'quote' | 'task';
  sub_type: string;
  title: string;
  description: string;
  result?: string | null;
  duration_minutes?: number | null;
  user?: { id: number; name: string } | null;
  timestamp: string;
}

export const activityTimelineService = {
  /**
   * S6-05: Danh sách hoạt động tương tác
   */
  async getActivities(params?: {
    customer_id?: number;
    opportunity_id?: number;
    lead_id?: number;
    activity_type?: string;
    user_id?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.customer_id) q.set('customer_id', String(params.customer_id));
    if (params?.opportunity_id) q.set('opportunity_id', String(params.opportunity_id));
    if (params?.lead_id) q.set('lead_id', String(params.lead_id));
    if (params?.activity_type) q.set('activity_type', params.activity_type);
    if (params?.user_id) q.set('user_id', String(params.user_id));
    const qs = q.toString();

    return api<{ success: boolean; data: { data: ActivityItem[]; total: number } }>(
      `/v1/activities${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * S6-05: Ghi nhận hoạt động tương tác (call/meeting/email/note)
   */
  async createActivity(payload: {
    activity_type: string;
    title: string;
    description?: string;
    customer_id?: number;
    contact_id?: number;
    opportunity_id?: number;
    lead_id?: number;
    duration_minutes?: number;
    result?: string;
    occurred_at?: string;
  }) {
    return api<{ success: boolean; message: string; data: ActivityItem }>('/v1/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * S6-06: Danh sách công việc có hạn hoàn thành (Tasks)
   */
  async getTasks(params?: {
    status?: string;
    priority?: string;
    customer_id?: number;
    opportunity_id?: number;
    all_staff?: boolean;
  }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.priority) q.set('priority', params.priority);
    if (params?.customer_id) q.set('customer_id', String(params.customer_id));
    if (params?.opportunity_id) q.set('opportunity_id', String(params.opportunity_id));
    if (params?.all_staff) q.set('all_staff', '1');
    const qs = q.toString();

    return api<{ success: boolean; data: { data: TaskItem[]; total: number } }>(
      `/v1/tasks${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * S6-06: Giao / Tạo công việc mới
   */
  async createTask(payload: {
    title: string;
    due_at: string;
    priority: 'low' | 'medium' | 'high';
    assigned_user_id: number;
    customer_id?: number;
    opportunity_id?: number;
    description?: string;
    reminder_minutes?: number;
  }) {
    return api<{ success: boolean; message: string; data: TaskItem }>('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * S6-06: Đánh dấu công việc hoàn thành
   */
  async completeTask(id: number) {
    return api<{ success: boolean; message: string; data: TaskItem }>(`/v1/tasks/${id}/complete`, {
      method: 'POST',
    });
  },

  /**
   * S6-06: Hoãn công việc kèm lý do bắt buộc
   */
  async postponeTask(id: number, payload: { new_due_at: string; postpone_reason: string }) {
    return api<{ success: boolean; message: string; data: TaskItem }>(`/v1/tasks/${id}/postpone`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * S6-08: Dòng thời gian tương tác khách hàng 360 (Activities, Changes, Quotes, Tasks)
   */
  async getCustomerTimeline(customerId: number | string, filters?: { type?: string; user_id?: number }) {
    const q = new URLSearchParams();
    if (filters?.type) q.set('type', filters.type);
    if (filters?.user_id) q.set('user_id', String(filters.user_id));
    const qs = q.toString();

    return api<{
      success: boolean;
      data: {
        customer: { id: number; name: string; code: string };
        timeline: CustomerTimelineEvent[];
        total_events: number;
      };
    }>(`/v1/customers/${customerId}/timeline${qs ? `?${qs}` : ''}`);
  },

  /**
   * S6-09: Cảnh báo việc sắp đến hạn, quá hạn và tổng hợp của nhóm
   */
  async getTaskReminders() {
    return api<{
      success: boolean;
      data: {
        overdue_tasks: TaskItem[];
        upcoming_tasks: TaskItem[];
        total_overdue: number;
        total_upcoming: number;
        leader_summary: Array<{
          user_id: number;
          user_name: string;
          email: string;
          overdue_count: number;
        }>;
      };
    }>('/v1/tasks/reminders');
  },

  /**
   * S6-10: Ghi nhanh kết quả cuộc gọi trên điện thoại (Quick Call - 3 chạm)
   * Tự động gắn vào cơ hội đang mở gần nhất và lên lịch gọi lại nếu có
   */
  async quickCallLog(payload: {
    customer_id: number;
    contact_id?: number;
    call_result: 'connected' | 'busy' | 'wrong_number' | 'no_answer';
    note?: string;
    callback_at?: string;
  }) {
    return api<{
      success: boolean;
      message: string;
      data: {
        activity: ActivityItem;
        attached_to_opportunity?: { id: number; name: string; stage: string } | null;
        scheduled_callback?: string | null;
      };
    }>('/v1/quick-call', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

import { Activity, CreateActivityPayload } from '../types/activity';

// Giả lập API gọi Backend hoặc kết nối Axios thực tế
export const activityService = {
  async getActivities(params?: any): Promise<Activity[]> {
    // Có thể kết nối axios: const res = await api.get('/v1/activities', { params });
    return [];
  },

  async createActivity(payload: CreateActivityPayload): Promise<Activity> {
    // const res = await api.post('/v1/activities', payload);
    // return res.data.data;
    
    // Fallback Mock Response nếu chưa kết nối DB
    return {
      id: Date.now(),
      user: { id: 1, name: 'NV Kinh Doanh' },
      customer: { id: payload.customer_id, name: 'Khách hàng #' + payload.customer_id },
      type: payload.type,
      title: payload.title,
      performed_at: payload.performed_at,
      duration_minutes: payload.duration_minutes || 0,
      description: payload.description,
      result: payload.result,
      status: 'completed',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  },

  async deleteActivity(id: number): Promise<void> {
    // await api.delete(`/v1/activities/${id}`);
  }
};
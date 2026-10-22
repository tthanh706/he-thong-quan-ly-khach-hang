export type ActivityType = 'call' | 'meeting' | 'email' | 'note';

export interface Activity {
  id: number;
  user: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    name: string;
  };
  contact?: {
    id: number;
    name: string;
  } | null;
  opportunity?: {
    id: number;
    title: string;
  } | null;
  type: ActivityType;
  title: string;
  performed_at: string;
  duration_minutes: number;
  description: string;
  result?: string;
  status: 'completed' | 'scheduled';
  created_at: string;
}

export interface CreateActivityPayload {
  customer_id: number;
  contact_id?: number | null;
  opportunity_id?: number | null;
  type: ActivityType;
  title: string;
  performed_at: string;
  duration_minutes?: number;
  description: string;
  result?: string;
}
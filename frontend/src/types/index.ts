export type User = {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'staff' | string;
  locked_at: string | null;
  phone?: string | null;
  job_title?: string | null;
  email_signature?: string | null;
  avatar_url?: string | null;
  customers_count?: number;
  opportunities_count?: number;
};

export type Customer = {
  id: number;
  name: string;
  email: string | null;
  owner: User;
};

export type Opportunity = {
  id: number;
  title: string;
  amount: string;
  status: string;
  owner: User;
};

export type HandoverLog = {
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
};

export type LoginPayload = {
  email: string;
  password: string;
};


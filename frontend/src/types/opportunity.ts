export type OpportunityStatus = 'open' | 'won' | 'lost' | 'in_progress';

export interface Opportunity {
  id: number;
  title: string;
  customer_name: string;
  amount: number;
  status: OpportunityStatus;
  actual_revenue?: number;
  actual_close_date?: string;
  loss_reason_id?: number;
  competitor_id?: number;
  created_at: string;
}

export interface CloseWonPayload {
  actual_revenue: number;
  actual_close_date: string;
}

export interface CloseLostPayload {
  loss_reason_id: number;
  loss_reason_note?: string;
  competitor_id?: number;
  competitor_name_custom?: string;
}

export interface ReopenPayload {
  reopen_reason: string;
}
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type CampaignChannel = 'facebook' | 'google' | 'email' | 'zalo' | 'website' | 'offline' | 'other';

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  budget: number;
  start_date: string;
  end_date: string | null;
  channel: CampaignChannel;
  channel_label: string;
  status: CampaignStatus;
  status_label: string;
  owner_id: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  lead_count?: number;
  opportunity_count?: number;
  closed_value?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string | null;
  budget: number;
  start_date: string;
  end_date?: string | null;
  channel: CampaignChannel;
  status?: CampaignStatus;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string | null;
  budget?: number;
  start_date?: string;
  end_date?: string | null;
  channel?: CampaignChannel;
  status?: CampaignStatus;
}

export interface CampaignListParams {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CampaignPerformanceParams {
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}
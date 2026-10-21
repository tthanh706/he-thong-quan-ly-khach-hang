import type { ApiResponse, CurrentUser } from './index';

export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'renewed';
export type AlertType = 'expiring_soon' | 'expired';

export interface ContractAlert {
  id: number;
  type: AlertType;
  message: string;
  detected_at: string | null;
}

export interface RenewalOpportunity {
  id: number;
  name: string;
  status: string;
  opportunity_type: string;
}

export interface Contract {
  id: number;
  contract_code: string;
  customer_name: string;
  owner_user_id: number | null;
  accountant_user_id: number | null;
  status: ContractStatus;
  contract_value: string | number;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number;
  is_expired: boolean;
  description: string | null;
  renewal_opportunity: RenewalOpportunity | null;
  alerts: ContractAlert[];
}

export interface ExpiryAlert {
  id: number;
  type: AlertType;
  message: string;
  detected_at: string | null;
  read_at: string | null;
  contract: {
    id: number;
    contract_code: string;
    customer_name: string;
    status: ContractStatus;
    end_date: string | null;
  } | null;
  recipient: CurrentUser | null;
}

export interface ExpirySetting {
  id: number;
  warning_days: number;
  is_active: boolean;
}

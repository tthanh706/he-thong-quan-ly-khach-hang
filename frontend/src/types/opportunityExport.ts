import type { ApiResponse, CurrentUser } from './index';

export interface OpportunityCustomField {
  id: number;
  name: string;
  field_key: string;
  field_type: string;
}

export type CustomField = OpportunityCustomField;

export interface OpportunityRow {
  id: number;
  name: string;
  owner: string | null;
  stage: string;
  status: string;
  value: number;
  expected_close_date: string | null;
  opportunity_type: string | null;
  cost_price?: number;
  profit_margin?: number;
  [key: `custom_${string}`]: string | number | null | undefined;
}

export interface OpportunityExportData {
  can_view_financials: boolean;
  custom_fields: OpportunityCustomField[];
  opportunities: OpportunityRow[];
}

export interface FilterOptionOwner {
  id: number;
  name: string;
  email: string;
}

export interface OpportunityFilterData {
  stages: string[];
  statuses: string[];
  owners: FilterOptionOwner[];
}

export interface OpportunityFilters {
  search?: string;
  stage?: string;
  status?: string;
  ownerUserId?: number | null;
  dateFrom?: string;
  dateTo?: string;
}

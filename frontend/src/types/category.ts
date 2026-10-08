export type CategoryType = 'LEAD_SOURCE' | 'INDUSTRY' | 'BUSINESS_TYPE' | 'COMPANY_TYPE';

export interface Category {
  id: number;
  code: string;
  name: string;
  type: CategoryType;
  description?: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface CreateCategoryPayload {
  code: string;
  name: string;
  type: CategoryType;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}
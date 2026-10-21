import { apiRequest } from '../api/client';

export type CategoryType = 'LEAD_SOURCE' | 'INDUSTRY' | 'BUSINESS_TYPE';

export interface CommonCategory {
  id: number;
  category_type: CategoryType;
  code: string;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CommonCategoriesResponse {
  success: boolean;
  message?: string;
  data: CommonCategory[];
}

export async function getCategories(categoryType?: CategoryType): Promise<CommonCategoriesResponse> {
  const query = categoryType ? `?category_type=${categoryType}` : '';
  return apiRequest<CommonCategoriesResponse>(`/v1/common-categories${query}`);
}

export async function createCategory(payload: Partial<CommonCategory>): Promise<{ success: boolean; data: CommonCategory }> {
  return apiRequest<{ success: boolean; data: CommonCategory }>('/v1/common-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id: number, payload: Partial<CommonCategory>): Promise<{ success: boolean; data: CommonCategory }> {
  return apiRequest<{ success: boolean; data: CommonCategory }>(`/v1/common-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/v1/common-categories/${id}`, {
    method: 'DELETE',
  });
}

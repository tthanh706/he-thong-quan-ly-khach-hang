import axiosInstance from './axiosInstance';
import type { Category, CreateCategoryPayload } from '../../types/category';

let MOCK_CATEGORIES: Category[] = [
  { id: 1, type: 'LEAD_SOURCE', code: 'SRC_WEB', name: 'Website Form', description: 'Thu thập từ web', sortOrder: 1, isActive: true },
  { id: 2, type: 'LEAD_SOURCE', code: 'SRC_FB', name: 'Facebook Ads', description: 'Chiến dịch QC Facebook', sortOrder: 2, isActive: true },
  { id: 3, type: 'INDUSTRY', code: 'IND_TECH', name: 'Công nghệ thông tin', description: 'Khách hàng công nghệ', sortOrder: 1, isActive: true },
  { id: 4, type: 'BUSINESS_TYPE', code: 'TYP_SME', name: 'Doanh nghiệp SME', description: 'Vừa và nhỏ', sortOrder: 1, isActive: true },
];

export const categoryApi = {
  getCategories: async (type?: string) => {
    try {
      const response = await axiosInstance.get('/categories', { params: { type } });
      return response.data;
    } catch {
      let filtered = MOCK_CATEGORIES;
      if (type && type !== 'ALL') {
        filtered = filtered.filter((c) => c.type === type);
      }
      return { data: filtered };
    }
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    try {
      const response = await axiosInstance.post('/categories', payload);
      return response.data.data;
    } catch {
      const newCat: Category = {
        id: Date.now(),
        type: payload.type,
        code: payload.code,
        name: payload.name,
        description: payload.description || '',
        sortOrder: payload.sortOrder || 1,
        isActive: payload.isActive ?? true,
      };
      MOCK_CATEGORIES.push(newCat);
      return newCat;
    }
  },

  updateCategory: async (id: number, payload: Partial<CreateCategoryPayload>): Promise<Category> => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, payload);
      return response.data.data;
    } catch {
      MOCK_CATEGORIES = MOCK_CATEGORIES.map((c) =>
        c.id === id ? { ...c, ...payload } : c
      );
      const updated = MOCK_CATEGORIES.find((c) => c.id === id);
      return updated!;
    }
  },

  deleteCategory: async (id: number | string) => {
    try {
      return await axiosInstance.delete(`/categories/${id}`);
    } catch {
      MOCK_CATEGORIES = MOCK_CATEGORIES.filter((c) => c.id !== Number(id));
      return { success: true };
    }
  },
};
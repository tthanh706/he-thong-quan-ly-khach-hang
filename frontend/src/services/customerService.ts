import { api } from './api';
import type {
  Customer,
  CustomerPayload,
  CustomerFilters,
  SavedFilterItem,
  CustomerFilterOptions,
} from '../types';

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  message?: string;
}

export const customerService = {
  /**
   * S3-01 / S3-07: Lấy danh sách khách hàng có tìm kiếm và đa điều kiện lọc
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.company_size) params.append('company_size', filters.company_size);
    if (filters.scale) params.append('scale', filters.scale);
    if (filters.area) params.append('area', filters.area);
    if (filters.owner_id) params.append('owner_id', String(filters.owner_id));
    if (filters.contact_phone) params.append('contact_phone', filters.contact_phone);
    if (filters.has_parent !== undefined && filters.has_parent !== '') {
      params.append('has_parent', String(filters.has_parent));
    }
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.page) params.append('page', String(filters.page));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api<CustomerListResponse>(`/v1/customers${queryString}`);
  },

  /**
   * S3-01: Lấy chi tiết hồ sơ một khách hàng doanh nghiệp
   */
  async getCustomer(id: string | number): Promise<{ success: boolean; data: Customer }> {
    return api<{ success: boolean; data: Customer }>(`/v1/customers/${id}`);
  },

  /**
   * S3-01: Khai báo mới hồ sơ khách hàng doanh nghiệp
   */
  async createCustomer(payload: CustomerPayload): Promise<{ success: boolean; data: Customer; message?: string }> {
    return api<{ success: boolean; data: Customer; message?: string }>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * S3-01: Cập nhật hồ sơ khách hàng
   */
  async updateCustomer(
    id: string | number,
    payload: Partial<CustomerPayload>
  ): Promise<{ success: boolean; data: Customer; message?: string }> {
    return api<{ success: boolean; data: Customer; message?: string }>(`/v1/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * S3-01: Xóa khách hàng
   */
  async deleteCustomer(id: string | number): Promise<{ success: boolean; message?: string }> {
    return api<{ success: boolean; message?: string }>(`/v1/customers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * S3-07: Lấy các lựa chọn cho bộ lọc và danh sách người sở hữu theo data scope
   */
  async getFilterOptions(): Promise<{ success: boolean; data: CustomerFilterOptions }> {
    return api<{ success: boolean; data: CustomerFilterOptions }>('/v1/customers/filter-options');
  },

  /**
   * S3-07: Lấy danh sách bộ lọc đã lưu của người dùng hiện tại
   */
  async getSavedFilters(): Promise<{ success: boolean; data: SavedFilterItem[] }> {
    return api<{ success: boolean; data: SavedFilterItem[] }>('/v1/customers/saved-filters');
  },

  /**
   * S3-07: Lưu bộ lọc hay dùng
   */
  async saveFilter(name: string, filters: CustomerFilters): Promise<{ success: boolean; data: SavedFilterItem; message?: string }> {
    return api<{ success: boolean; data: SavedFilterItem; message?: string }>('/v1/customers/saved-filters', {
      method: 'POST',
      body: JSON.stringify({ name, filters, module: 'customers' }),
    });
  },

  /**
   * S3-07: Xóa bộ lọc đã lưu
   */
  async deleteSavedFilter(id: number): Promise<{ success: boolean; message?: string }> {
    return api<{ success: boolean; message?: string }>(`/v1/customers/saved-filters/${id}`, {
      method: 'DELETE',
    });
  },
};

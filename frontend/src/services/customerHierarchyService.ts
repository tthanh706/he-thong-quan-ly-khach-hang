import { apiClient } from '../api/client';
import type {
  CustomerHierarchy,
  GroupContractValue,
  UpdateParentPayload,
} from '../types/customerHierarchy';

export const customerHierarchyService = {
  async getHierarchy(customerId: number): Promise<CustomerHierarchy> {
    const response = await apiClient<{ data: CustomerHierarchy }>(
      `/api/v1/customers/${customerId}/hierarchy`,
    );

    return response.data;
  },

  async updateParent(
    customerId: number,
    parentCustomerId: number | null,
  ): Promise<{ id: number; name: string; parent_customer_id: number | null }> {
    const payload: UpdateParentPayload = {
      parent_customer_id: parentCustomerId,
    };

    const response = await apiClient<{
      data: {
        id: number;
        name: string;
        parent_customer_id: number | null;
      };
    }>(`/api/v1/customers/${customerId}/parent`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return response.data;
  },

  async getGroupContractValue(customerId: number): Promise<GroupContractValue> {
    const response = await apiClient<{ data: GroupContractValue }>(
      `/api/v1/customers/${customerId}/group-contract-value`,
    );

    return response.data;
  },
};

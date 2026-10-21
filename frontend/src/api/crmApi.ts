import { apiRequest } from './client';

export interface Customer360Data {
  company: {
    id: string;
    code: string;
    name: string;
    taxCode: string;
    industry: string;
    address: string;
    email: string;
    phone: string;
    tier: string;
    owner?: string;
    createdAt?: string;
    parent?: { id: string; name: string; code?: string } | null;
    subsidiaries?: Array<{
      id: string;
      name: string;
      code: string;
      taxCode?: string;
      tier?: string;
    }>;
  };
  statistics: {
    totalContractValue: number;
    activeContractsCount: number;
    openSupportCount: number;
    pendingCareCount: number;
    contactsCount: number;
  };
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    department?: string;
    email: string;
    phone: string;
    isPrimary: boolean;
    roleInDecision?: string;
  }>;
  contracts: Array<{
    id: string;
    contractNumber: string;
    title: string;
    value: number;
    startDate?: string | null;
    endDate?: string | null;
    status: string;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    closingDate?: string | null;
  }>;
  supportRequests: Array<{
    id: string;
    code: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
    isOverdue: boolean;
  }>;
  periodicCares: Array<{
    id: string;
    careType: string;
    scheduledDate: string;
    status: string;
    isOverdue: boolean;
    notes?: string;
  }>;
}

export const fetchCustomer360 = async (id: string | number): Promise<Customer360Data | null> => {
  try {
    const res = await apiRequest<{ success: boolean; data: Customer360Data }>(`/v1/customers/${id}/360`);
    return res.data;
  } catch (e) {
    console.error('Error fetching customer 360:', e);
    return null;
  }
};

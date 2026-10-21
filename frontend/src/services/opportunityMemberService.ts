import api from '../api';
import type {
  OpportunityMember,
  OpportunityOwnershipLog,
  AddMemberRequest,
  TransferOwnershipRequest,
} from '../types/opportunityMember';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const opportunityMemberService = {
  async getMembers(opportunityId: number): Promise<OpportunityMember[]> {
    const response = await api.get<ApiResponse<OpportunityMember[]>>(
      `/api/v1/opportunities/${opportunityId}/members`
    );
    return response.data.data;
  },

  async addMember(
    opportunityId: number,
    payload: AddMemberRequest
  ): Promise<OpportunityMember> {
    const response = await api.post<ApiResponse<OpportunityMember>>(
      `/api/v1/opportunities/${opportunityId}/members`,
      payload
    );
    return response.data.data;
  },

  async removeMember(opportunityId: number, userId: number): Promise<void> {
    await api.delete(`/api/v1/opportunities/${opportunityId}/members/${userId}`);
  },

  async transferOwnership(
    opportunityId: number,
    payload: TransferOwnershipRequest
  ): Promise<any> {
    const response = await api.post<ApiResponse<any>>(
      `/api/v1/opportunities/${opportunityId}/transfer-ownership`,
      payload
    );
    return response.data.data;
  },

  async getOwnershipLogs(opportunityId: number): Promise<OpportunityOwnershipLog[]> {
    const response = await api.get<ApiResponse<OpportunityOwnershipLog[]>>(
      `/api/v1/opportunities/${opportunityId}/ownership-logs`
    );
    return response.data.data;
  },
};
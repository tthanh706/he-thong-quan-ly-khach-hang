import { useState, useCallback } from 'react';
import { opportunityMemberService } from '../services/opportunityMemberService';
import type {
  OpportunityMember,
  OpportunityOwnershipLog,
  AddMemberRequest,
  TransferOwnershipRequest,
} from '../types/opportunityMember';

export function useOpportunityMembers(opportunityId: number) {
  const [members, setMembers] = useState<OpportunityMember[]>([]);
  const [ownershipLogs, setOwnershipLogs] = useState<OpportunityOwnershipLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await opportunityMemberService.getMembers(opportunityId);
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  const fetchOwnershipLogs = useCallback(async () => {
    if (!opportunityId) return;
    try {
      const data = await opportunityMemberService.getOwnershipLogs(opportunityId);
      setOwnershipLogs(data);
    } catch (err: any) {
      // silent
    }
  }, [opportunityId]);

  const addMember = useCallback(
    async (payload: AddMemberRequest) => {
      setLoading(true);
      setError(null);
      try {
        const created = await opportunityMemberService.addMember(opportunityId, payload);
        setMembers((prev) => [...prev, created]);
        return created;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Thêm thành viên thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const removeMember = useCallback(
    async (userId: number) => {
      setLoading(true);
      setError(null);
      try {
        await opportunityMemberService.removeMember(opportunityId, userId);
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Xóa thành viên thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId]
  );

  const transferOwnership = useCallback(
    async (payload: TransferOwnershipRequest) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await opportunityMemberService.transferOwnership(
          opportunityId,
          payload
        );
        await fetchMembers();
        await fetchOwnershipLogs();
        return updated;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Chuyển quyền sở hữu thất bại');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [opportunityId, fetchMembers, fetchOwnershipLogs]
  );

  return {
    members,
    ownershipLogs,
    loading,
    error,
    fetchMembers,
    fetchOwnershipLogs,
    addMember,
    removeMember,
    transferOwnership,
  };
}
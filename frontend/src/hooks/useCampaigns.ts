import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '../services/api';
import type { CampaignFilters, CampaignPayload } from '../types';
import toast from 'react-hot-toast';

export function useCampaigns(filters: CampaignFilters = {}) {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: () => campaignsApi.list(filters),
  });
}

export function useCampaign(id: number) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CampaignPayload) => campaignsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Tạo chiến dịch thành công!');
    },
    onError: () => toast.error('Tạo chiến dịch thất bại.'),
  });
}

export function useUpdateCampaign(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CampaignPayload>) => campaignsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['campaign', id] });
      toast.success('Cập nhật chiến dịch thành công!');
    },
    onError: () => toast.error('Cập nhật thất bại.'),
  });
}

export function useChangeCampaignStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      campaignsApi.changeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Cập nhật trạng thái thành công!');
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => campaignsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Đã xóa chiến dịch.');
    },
  });
}

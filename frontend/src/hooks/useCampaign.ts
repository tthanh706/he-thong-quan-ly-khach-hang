import { useState, useCallback } from 'react';
import { campaignService } from '../services/campaignService';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignListParams,
} from '../types/campaign';

export function useCampaign() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 15, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (params?: CampaignListParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignService.getList(params);
      setCampaigns(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chiến dịch');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (payload: CreateCampaignRequest) => {
    setLoading(true);
    setError(null);
    try {
      const created = await campaignService.create(payload);
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (id: number, payload: UpdateCampaignRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await campaignService.update(id, payload);
      return updated;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await campaignService.delete(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xóa chiến dịch thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    campaigns,
    meta,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}
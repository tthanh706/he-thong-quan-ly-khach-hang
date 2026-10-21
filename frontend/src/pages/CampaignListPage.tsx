import React, { useEffect, useState } from 'react';
import { useCampaign } from '../hooks/useCampaign';
import { CampaignForm } from '../components/campaign/CampaignForm';
import { CAMPAIGN_STATUS_COLOR } from '../constants/campaign';
import type { Campaign, CreateCampaignRequest } from '../types/campaign';

export const CampaignListPage: React.FC = () => {
  const { campaigns, meta, loading, error, fetchCampaigns, createCampaign, deleteCampaign } =
    useCampaign();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCampaigns({ search, per_page: 15 });
  }, [fetchCampaigns, search]);

  const handleCreate = async (data: CreateCampaignRequest) => {
    await createCampaign(data);
    setShowForm(false);
    fetchCampaigns({ search });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa chiến dịch này?')) {
      await deleteCampaign(id);
      fetchCampaigns({ search });
    }
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Chiến dịch</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thêm chiến dịch
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên chiến dịch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Tạo chiến dịch mới</h2>
            <CampaignForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tên chiến dịch
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kênh
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ngân sách
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Số Lead
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Số Cơ hội
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Giá trị đã chốt
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && campaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Chưa có chiến dịch nào
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.channel_label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatCurrency(campaign.budget)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.start_date}
                    {campaign.end_date ? ` → ${campaign.end_date}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {campaign.lead_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {campaign.opportunity_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-700 font-semibold">
                    {formatCurrency(campaign.closed_value)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${
                        CAMPAIGN_STATUS_COLOR[campaign.status]
                      }-100 text-${CAMPAIGN_STATUS_COLOR[campaign.status]}-800`}
                    >
                      {campaign.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination đơn giản */}
      {meta.last_page > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Trang {meta.current_page} / {meta.last_page} · Tổng {meta.total} chiến dịch
          </span>
        </div>
      )}
    </div>
  );
};
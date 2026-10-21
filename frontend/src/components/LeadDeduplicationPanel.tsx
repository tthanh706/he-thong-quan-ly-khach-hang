import React, { useCallback, useEffect, useState } from 'react';
import leadApi from '../services/leadApi';
import type {
  DuplicateCheckResult,
  Lead,
  LeadListParams,
  PaginatedResponse,
} from '../types/lead.types';
import DuplicateWarningBanner from './DuplicateWarningBanner';
import LeadMergeModal from './LeadMergeModal';
import LinkCustomerModal from './LinkCustomerModal';

/**
 * LeadDeduplicationPanel
 *
 * Main component for viewing leads and managing deduplication.
 * Displays lead list with duplicate detection, merge, and customer linking UI.
 */
const LeadDeduplicationPanel: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Lead>['meta'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [params, setParams] = useState<LeadListParams>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_dir: 'desc',
  });

  // Duplicate check state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [duplicateLoading, setDuplicateLoading] = useState<boolean>(false);

  // Modals
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leadApi.getLeads({ ...params, search: searchQuery || undefined });
      setLeads(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError('Không thể tải danh sách lead. Vui lòng thử lại.');
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [params, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleCheckDuplicates = async (lead: Lead) => {
    setSelectedLead(lead);
    setDuplicateLoading(true);
    setDuplicateResult(null);
    try {
      const result = await leadApi.checkDuplicates(lead.id);
      setDuplicateResult(result);
    } catch (err) {
      setError('Không thể kiểm tra trùng lặp.');
      console.error('Duplicate check failed:', err);
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleMergeSuccess = () => {
    setShowMergeModal(false);
    setDuplicateResult(null);
    setSelectedLead(null);
    fetchLeads();
  };

  const handleLinkSuccess = () => {
    setShowLinkModal(false);
    setDuplicateResult(null);
    setSelectedLead(null);
    fetchLeads();
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadgeClass = (status: Lead['status']): string => {
    const classes: Record<Lead['status'], string> = {
      new: 'badge badge--new',
      contacted: 'badge badge--contacted',
      qualified: 'badge badge--qualified',
      converted: 'badge badge--converted',
      lost: 'badge badge--lost',
      merged: 'badge badge--merged',
    };
    return classes[status] ?? 'badge';
  };

  return (
    <div className="lead-dedup-panel">
      <header className="lead-dedup-panel__header">
        <h1>Quản lý Lead - Phát hiện trùng lặp</h1>
        <p className="lead-dedup-panel__subtitle">
          Tìm kiếm, kiểm tra trùng lặp, gộp lead và gắn khách hàng hiện có
        </p>
      </header>

      {/* Search Bar */}
      <form className="lead-dedup-panel__search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Tìm theo tên, email, SĐT, công ty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn btn--primary">
          Tìm kiếm
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
          <button onClick={() => setError(null)} className="alert__close">
            ×
          </button>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateResult && selectedLead && (
        <DuplicateWarningBanner
          result={duplicateResult}
          lead={selectedLead}
          onMerge={() => setShowMergeModal(true)}
          onLinkCustomer={() => setShowLinkModal(true)}
          onDismiss={() => {
            setDuplicateResult(null);
            setSelectedLead(null);
          }}
        />
      )}

      {/* Lead Table */}
      <div className="lead-dedup-panel__table-wrapper">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>Đang tải...</span>
          </div>
        ) : (
          <table className="lead-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Công ty</th>
                <th>Trạng thái</th>
                <th>Người phụ trách</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="lead-table__empty">
                    Không tìm thấy lead nào.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="lead-table__row">
                    <td className="lead-table__name">{lead.full_name}</td>
                    <td>{lead.email ?? '—'}</td>
                    <td>{lead.phone_number ?? '—'}</td>
                    <td>{lead.company_name ?? '—'}</td>
                    <td>
                      <span className={getStatusBadgeClass(lead.status)}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.assigned_user?.name ?? '—'}</td>
                    <td>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="lead-table__actions">
                      <button
                        className="btn btn--sm btn--outline"
                        onClick={() => handleCheckDuplicates(lead)}
                        disabled={duplicateLoading && selectedLead?.id === lead.id}
                      >
                        {duplicateLoading && selectedLead?.id === lead.id
                          ? 'Đang kiểm tra...'
                          : 'Kiểm tra trùng'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="pagination">
          <button
            className="btn btn--sm"
            disabled={meta.current_page <= 1}
            onClick={() => handlePageChange(meta.current_page - 1)}
          >
            ← Trước
          </button>
          <span className="pagination__info">
            Trang {meta.current_page} / {meta.last_page} (Tổng: {meta.total})
          </span>
          <button
            className="btn btn--sm"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => handlePageChange(meta.current_page + 1)}
          >
            Tiếp →
          </button>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && selectedLead && duplicateResult && (
        <LeadMergeModal
          primaryLead={selectedLead}
          duplicateLeads={duplicateResult.duplicate_leads}
          onMergeSuccess={handleMergeSuccess}
          onClose={() => setShowMergeModal(false)}
        />
      )}

      {/* Link Customer Modal */}
      {showLinkModal && selectedLead && duplicateResult && (
        <LinkCustomerModal
          lead={selectedLead}
          matchingCustomers={duplicateResult.matching_customers}
          onLinkSuccess={handleLinkSuccess}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  );
};

export default LeadDeduplicationPanel;

import { useEffect, useMemo, useState } from 'react';
import {
  exportOpportunities,
  getOpportunities,
  getOpportunityFilters,
} from '../services/opportunityExportService';
import { useAuth } from '../hooks/useAuth';
import type { CurrentUser } from '../types';
import type {
  OpportunityExportData,
  OpportunityFilterData,
  OpportunityFilters,
} from '../types/opportunityExport';
import OpportunityTable from '../components/opportunityExport/OpportunityTable';
import SummaryCards from '../components/opportunityExport/SummaryCards';
import './OpportunityExportPage.css';

interface OpportunityExportPageProps {
  user?: CurrentUser;
  onLogout?: () => void;
}

const emptyFilterData: OpportunityFilterData = {
  stages: [],
  statuses: [],
  owners: [],
};

export default function OpportunityExportPage({ user: propUser }: OpportunityExportPageProps) {
  const { user: authUser } = useAuth();
  const user: CurrentUser = (propUser || authUser || {
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    role: 'staff',
  }) as CurrentUser;

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [ownerUserId, setOwnerUserId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [filterData, setFilterData] = useState<OpportunityFilterData>(emptyFilterData);
  const [data, setData] = useState<OpportunityExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const currentFilters = useMemo<OpportunityFilters>(
    () => ({
      search: search.trim() || undefined,
      stage: stage || undefined,
      status: status || undefined,
      ownerUserId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, stage, status, ownerUserId, dateFrom, dateTo]
  );

  async function loadFilters(): Promise<void> {
    try {
      const result = await getOpportunityFilters();
      setFilterData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải bộ lọc.');
    }
  }

  async function loadOpportunities(filters: OpportunityFilters = currentFilters): Promise<void> {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await getOpportunities(filters);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách cơ hội.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFilters();
    void loadOpportunities({});
  }, []);

  async function handleExport(): Promise<void> {
    setExporting(true);
    setError('');
    setMessage('');

    try {
      await exportOpportunities(currentFilters);
      setMessage('Đã xuất Excel theo đúng bộ lọc đang áp dụng.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xuất Excel.');
    } finally {
      setExporting(false);
    }
  }

  function resetFilters(): void {
    setSearch('');
    setStage('');
    setStatus('');
    setOwnerUserId(null);
    setDateFrom('');
    setDateTo('');

    void loadOpportunities({});
  }

  const canViewFinancials = data?.can_view_financials ?? false;

  return (
    <div className="opportunity-export-page" style={{ padding: '24px' }}>
      <header className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div className="eyebrow" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px' }}>
            S8-10 · OPPORTUNITY EXPORT
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Danh sách cơ hội & xuất Excel</h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Lọc dữ liệu trước khi xuất báo cáo cơ hội kinh doanh theo mẫu quản lý.
          </p>
        </div>

        <span
          className={canViewFinancials ? 'permission-badge allowed' : 'permission-badge restricted'}
          style={{
            background: canViewFinancials ? '#dcfce7' : '#f1f5f9',
            color: canViewFinancials ? '#15803d' : '#64748b',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {canViewFinancials ? '✓ Có quyền xem tài chính' : '🔒 Ẩn dữ liệu tài chính'}
        </span>
      </header>

      <main className="dashboard">
        {message && <div className="success-box" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}
        {error && <div className="error-box" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

        <section className="panel filter-panel" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Bộ lọc cơ hội</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                Nút Xuất Excel sẽ áp dụng chính các điều kiện lọc đang chọn.
              </p>
            </div>

            <button
              className="excel-button"
              onClick={handleExport}
              disabled={exporting}
              style={{ padding: '9px 18px', borderRadius: '6px', border: 0, background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
          </div>

          <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <label className="search-field" style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Tìm kiếm
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên cơ hội hoặc phụ trách..."
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Giai đoạn
              <select value={stage} onChange={(event) => setStage(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">Tất cả</option>
                {filterData.stages.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Trạng thái
              <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="">Tất cả</option>
                {filterData.statuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Người phụ trách
              <select
                value={ownerUserId ?? ''}
                onChange={(event) => setOwnerUserId(event.target.value ? Number(event.target.value) : null)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Tất cả</option>
                {filterData.owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Từ ngày chốt
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </label>

            <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Đến ngày chốt
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={() => void loadOpportunities(currentFilters)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Áp dụng
            </button>
            <button
              className="secondary-button"
              onClick={resetFilters}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
            >
              Xóa lọc
            </button>
          </div>
        </section>

        <SummaryCards rows={data?.opportunities ?? []} canViewFinancials={canViewFinancials} />

        <section className="panel" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
          <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Danh sách cơ hội</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                {data?.opportunities.length ?? 0} kết quả · {data?.custom_fields.length ?? 0} trường tùy chỉnh
              </p>
            </div>
            {!canViewFinancials && (
              <div className="privacy-note" style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                Giá vốn và biên lợi nhuận đã được ẩn theo quyền truy cập tài chính.
              </div>
            )}
          </div>

          <OpportunityTable
            rows={data?.opportunities ?? []}
            customFields={data?.custom_fields ?? []}
            canViewFinancials={canViewFinancials}
            loading={loading}
          />
        </section>
      </main>
    </div>
  );
}

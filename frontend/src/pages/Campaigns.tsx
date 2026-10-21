import { useState } from 'react';
import {
  useCampaigns, useCreateCampaign,
  useDeleteCampaign, useChangeCampaignStatus,
} from '../hooks/useCampaigns';
import type { CampaignFilters, CampaignPayload, CampaignStatus } from '../types';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import CampaignForm from '../components/campaign/CampaignForm';
import { Plus, Search, Trash2, PlayCircle, PauseCircle } from 'lucide-react';

export default function Campaigns() {
  const [filters, setFilters] = useState<CampaignFilters>({ per_page: 15, page: 1 });
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useCampaigns(filters);
  const createMutation = useCreateCampaign();
  const deleteMutation = useDeleteCampaign();
  const statusMutation = useChangeCampaignStatus();

  const meta = data?.data;

  const handleCreate = async (payload: CampaignPayload) => {
    await createMutation.mutateAsync(payload);
    setCreateOpen(false);
  };

  const toggle = (id: number, current: CampaignStatus) => {
    const next = current === 'active' ? 'paused' : 'active';
    statusMutation.mutate({ id, status: next });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Chiến dịch</h1>
          <p className="page-sub">Quản lý các chiến dịch marketing</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Tạo chiến dịch
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Tìm theo tên chiến dịch..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <select
          className="form-select filter-select"
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="active">Hoạt động</option>
          <option value="paused">Tạm dừng</option>
          <option value="completed">Hoàn thành</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? <Spinner /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên chiến dịch</th>
                  <th>Trạng thái</th>
                  <th>Ngân sách</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meta?.data?.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <p className="cell-name">{c.name}</p>
                      <p className="cell-sub">{c.description?.slice(0, 60) ?? '—'}</p>
                    </td>
                    <td><Badge label={c.status} variant={c.status} /></td>
                    <td>{c.budget ? Number(c.budget).toLocaleString('vi') + ' đ' : '—'}</td>
                    <td>{c.starts_at ? new Date(c.starts_at).toLocaleDateString('vi') : '—'}</td>
                    <td>{c.ends_at   ? new Date(c.ends_at).toLocaleDateString('vi')   : '—'}</td>
                    <td>
                      <div className="row-actions">
                        {(c.status === 'active' || c.status === 'paused') && (
                          <button
                            className="icon-btn"
                            title={c.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                            onClick={() => toggle(c.id, c.status)}
                          >
                            {c.status === 'active'
                              ? <PauseCircle size={15} />
                              : <PlayCircle size={15} />}
                          </button>
                        )}
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Xóa"
                          onClick={() => {
                            if (confirm(`Xóa chiến dịch "${c.name}"?`))
                              deleteMutation.mutate(c.id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {meta?.data?.length === 0 && (
                  <tr><td colSpan={6} className="empty-cell">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.last_page > 1 && (
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            onPage={(p) => setFilters({ ...filters, page: p })}
          />
        )}
      </div>

      <Modal open={createOpen} title="Tạo chiến dịch mới" onClose={() => setCreateOpen(false)}>
        <CampaignForm onSubmit={handleCreate} loading={createMutation.isPending} />
      </Modal>
    </div>
  );
}

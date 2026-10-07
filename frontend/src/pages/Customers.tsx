import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomers, useDeleteCustomer, useCreateCustomer } from '../hooks/useCustomers';
import type { CustomerFilters, CustomerPayload } from '../types';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import CustomerForm from '../components/customer/CustomerForm';
import { Plus, Search, Trash2, Eye } from 'lucide-react';

export default function Customers() {
  const [filters, setFilters] = useState<CustomerFilters>({ per_page: 15, page: 1 });
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useCustomers(filters);
  const deleteMutation = useDeleteCustomer();
  const createMutation = useCreateCustomer();

  const meta = data?.data;

  const handleCreate = async (payload: CustomerPayload) => {
    await createMutation.mutateAsync(payload);
    setCreateOpen(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Khách hàng</h1>
          <p className="page-sub">Quản lý danh sách khách hàng</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Tìm theo tên, email, SĐT..."
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
          <option value="lead">Tiềm năng</option>
          <option value="prospect">Triển vọng</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? <Spinner /> : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Công ty</th>
                  <th>Điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meta?.data?.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-user">
                        <div className="cell-avatar">{c.name[0]}</div>
                        <div>
                          <p className="cell-name">{c.name}</p>
                          <p className="cell-sub">{c.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>{c.company ?? '—'}</td>
                    <td>{c.phone ?? '—'}</td>
                    <td><Badge label={c.status} variant={c.status} /></td>
                    <td>{new Date(c.created_at).toLocaleDateString('vi')}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/customers/${c.id}`} className="icon-btn" title="Xem chi tiết">
                          <Eye size={15} />
                        </Link>
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Xóa"
                          onClick={() => {
                            if (confirm(`Xóa khách hàng "${c.name}"?`))
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

      {/* Create modal */}
      <Modal open={createOpen} title="Thêm khách hàng mới" onClose={() => setCreateOpen(false)}>
        <CustomerForm onSubmit={handleCreate} loading={createMutation.isPending} />
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '../hooks/useCustomers';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import CustomerForm from '../components/customer/CustomerForm';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import type { CustomerPayload } from '../types';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading } = useCustomer(Number(id));
  const updateMutation = useUpdateCustomer(Number(id));
  const deleteMutation = useDeleteCustomer();

  const customer = data?.data;

  if (isLoading) return <div className="page"><Spinner /></div>;
  if (!customer) return null;

  const handleUpdate = async (payload: CustomerPayload) => {
    await updateMutation.mutateAsync(payload);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Xóa khách hàng "${customer.name}"?`)) return;
    await deleteMutation.mutateAsync(customer.id);
    navigate('/customers');
  };

  const fields = [
    { label: 'Email',     value: customer.email },
    { label: 'Điện thoại', value: customer.phone },
    { label: 'Công ty',   value: customer.company },
    { label: 'Địa chỉ',  value: customer.address },
    { label: 'Ghi chú',  value: customer.notes },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            <p className="page-sub">{customer.company ?? 'Chưa có công ty'}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>
            <Edit size={15} /> Chỉnh sửa
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={15} /> Xóa
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Thông tin liên hệ</h2>
            <Badge label={customer.status} variant={customer.status} />
          </div>
          <div className="detail-fields">
            {fields.map(({ label, value }) => (
              <div key={label} className="detail-field">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value ?? '—'}</span>
              </div>
            ))}
            <div className="detail-field">
              <span className="detail-label">Ngày tạo</span>
              <span className="detail-value">{new Date(customer.created_at).toLocaleDateString('vi')}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal open={editOpen} title="Chỉnh sửa khách hàng" onClose={() => setEditOpen(false)}>
        <CustomerForm
          defaultValues={customer}
          onSubmit={handleUpdate}
          loading={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}

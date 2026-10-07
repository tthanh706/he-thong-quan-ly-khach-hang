import { useForm } from 'react-hook-form';
import type { Customer, CustomerPayload } from '../../types';

interface Props {
  defaultValues?: Partial<Customer>;
  onSubmit: (data: CustomerPayload) => void;
  loading?: boolean;
}

export default function CustomerForm({ defaultValues, onSubmit, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerPayload>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      company: defaultValues?.company ?? '',
      address: defaultValues?.address ?? '',
      status: defaultValues?.status ?? 'lead',
      notes: defaultValues?.notes ?? '',
    },
  });

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Họ tên *</label>
          <input className={`form-input ${errors.name ? 'form-input--error' : ''}`}
            {...register('name', { required: 'Tên không được để trống' })} />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" {...register('email')} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Số điện thoại</label>
          <input className="form-input" {...register('phone')} />
        </div>
        <div className="form-group">
          <label className="form-label">Công ty</label>
          <input className="form-input" {...register('company')} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Địa chỉ</label>
        <input className="form-input" {...register('address')} />
      </div>
      <div className="form-group">
        <label className="form-label">Trạng thái</label>
        <select className="form-select" {...register('status')}>
          <option value="lead">Tiềm năng</option>
          <option value="prospect">Triển vọng</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Ghi chú</label>
        <textarea rows={3} className="form-textarea" {...register('notes')} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}

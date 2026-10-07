import { useForm } from 'react-hook-form';
import type { Campaign, CampaignPayload } from '../../types';

interface Props {
  defaultValues?: Partial<Campaign>;
  onSubmit: (data: CampaignPayload) => void;
  loading?: boolean;
}

export default function CampaignForm({ defaultValues, onSubmit, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignPayload>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'draft',
      starts_at: defaultValues?.starts_at?.slice(0, 10) ?? '',
      ends_at: defaultValues?.ends_at?.slice(0, 10) ?? '',
      budget: defaultValues?.budget ? Number(defaultValues.budget) : undefined,
    },
  });

  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group">
        <label className="form-label">Tên chiến dịch *</label>
        <input className={`form-input ${errors.name ? 'form-input--error' : ''}`}
          {...register('name', { required: 'Tên không được để trống' })} />
        {errors.name && <p className="form-error">{errors.name.message}</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Mô tả</label>
        <textarea rows={3} className="form-textarea" {...register('description')} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <select className="form-select" {...register('status')}>
            <option value="draft">Nháp</option>
            <option value="active">Hoạt động</option>
            <option value="paused">Tạm dừng</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Ngân sách (VNĐ)</label>
          <input type="number" className="form-input" {...register('budget', { min: 0 })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Ngày bắt đầu</label>
          <input type="date" className="form-input" {...register('starts_at')} />
        </div>
        <div className="form-group">
          <label className="form-label">Ngày kết thúc</label>
          <input type="date" className="form-input" {...register('ends_at')} />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}

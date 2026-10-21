import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateCampaignRequest, Campaign } from '../../types/campaign';
import { CAMPAIGN_CHANNEL_OPTIONS, CAMPAIGN_STATUS_OPTIONS } from '../../constants/campaign';

const schema = z.object({
  name: z.string().min(1, 'Tên chiến dịch là bắt buộc').max(255),
  description: z.string().max(2000).optional().nullable(),
  budget: z.number().min(0, 'Ngân sách phải ≥ 0'),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional().nullable(),
  channel: z.enum(['facebook', 'google', 'email', 'zalo', 'website', 'offline', 'other']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
}).refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  { message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu', path: ['end_date'] }
);

type FormData = z.infer<typeof schema>;

interface CampaignFormProps {
  initialData?: Campaign | null;
  onSubmit: (data: CreateCampaignRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      budget: initialData?.budget ?? 0,
      start_date: initialData?.start_date ?? '',
      end_date: initialData?.end_date ?? '',
      channel: initialData?.channel ?? 'facebook',
      status: initialData?.status ?? 'draft',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || null,
      budget: data.budget,
      start_date: data.start_date,
      end_date: data.end_date || null,
      channel: data.channel,
      status: data.status,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên chiến dịch *</label>
        <input
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Nhập tên chiến dịch"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mô tả</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngân sách (VNĐ) *</label>
          <input
            type="number"
            step="0.01"
            {...register('budget', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kênh *</label>
          <select
            {...register('channel')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {CAMPAIGN_CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
          <input
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
          <input
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          {CAMPAIGN_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo chiến dịch'}
        </button>
      </div>
    </form>
  );
};
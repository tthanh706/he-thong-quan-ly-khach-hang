import { useState } from 'react';
import { Button } from '../common/Button';
import type { Contact } from '../../types';

interface TransferContactFormProps {
  contact: Contact;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (newCustomerId: number) => Promise<void>;
}

export const TransferContactForm = ({ contact, submitting = false, onCancel, onSubmit }: TransferContactFormProps) => {
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(customerId);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError('ID khách hàng mới phải là số nguyên dương.');
      return;
    }

    if (parsed === contact.customer_id) {
      setError('Người liên hệ đang thuộc khách hàng này.');
      return;
    }

    setError('');
    await onSubmit(parsed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">{contact.name || contact.full_name}</div>
        <div>Khách hàng hiện tại: {contact.companyName || contact.customer?.name || (contact.companyId ? `Công ty #${contact.companyId}` : `#${contact.customer_id}`)}</div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">ID khách hàng mới *</label>
        <input type="number" min="1" required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: 2" />
      </div>

      <p className="text-xs text-slate-500">Backend sẽ lưu lịch sử khách hàng cũ, khách hàng mới, người thực hiện và thời gian chuyển.</p>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Đang chuyển...' : 'Chuyển công ty'}</Button>
      </div>
    </form>
  );
};

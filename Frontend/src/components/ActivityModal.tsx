import { FormEvent, useState } from 'react';
import type { Opportunity } from '../types/opportunity';

interface Props {
  opportunity: Opportunity;
  onClose: () => void;
  onSubmit: (type: string, note: string) => Promise<void>;
}

export default function ActivityModal({ opportunity, onClose, onSubmit }: Props) {
  const [type, setType] = useState('call');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type) {
      setError('Vui lòng chọn loại hoạt động.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(type, note.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận hoạt động.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={handleSubmit}>
        <div className="section-title"><div><h2>Ghi nhận hoạt động</h2><p>{opportunity.name}</p></div></div>
        <label>Loại hoạt động</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="call">Gọi điện</option>
          <option value="email">Email</option>
          <option value="meeting">Cuộc họp</option>
          <option value="note">Ghi chú</option>
        </select>
        <label>Ghi chú</label>
        <textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nội dung trao đổi với khách hàng..." />
        {error && <div className="error-box">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>Hủy</button>
          <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Đang lưu...' : 'Ghi nhận'}</button>
        </div>
      </form>
    </div>
  );
}

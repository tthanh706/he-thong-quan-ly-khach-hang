import { useEffect, useState } from 'react';
import type { Lead } from '../../types/lead';

interface RejectLeadModalProps {
  lead: Lead | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RejectLeadModal({
  lead,
  submitting,
  onClose,
  onSubmit,
}: RejectLeadModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setReason('');
      setError('');
    }
  }, [lead]);

  if (!lead) {
    return null;
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Bạn phải nhập lý do từ chối lead.');
      return;
    }

    setError('');
    await onSubmit(trimmed);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">TỪ CHỐI LEAD</p>
            <h2 id="reject-title">{lead.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <label className="field-label" htmlFor="reject-reason">
          Lý do từ chối <span className="required">*</span>
        </label>
        <textarea
          id="reject-reason"
          className="textarea"
          rows={5}
          maxLength={1000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ví dụ: Khách hàng không thuộc khu vực phụ trách..."
          autoFocus
        />
        <div className="field-footer">
          <span className="error-text">{error}</span>
          <span className="char-count">{reason.length}/1000</span>
        </div>

        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button className="button button-danger" type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </section>
    </div>
  );
}

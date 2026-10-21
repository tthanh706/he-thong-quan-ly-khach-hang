import React, { useState } from 'react';
import leadApi from '../services/leadApi';
import type { Lead } from '../types/lead.types';

interface LeadMergeModalProps {
  primaryLead: Lead;
  duplicateLeads: Lead[];
  onMergeSuccess: () => void;
  onClose: () => void;
}

/**
 * LeadMergeModal
 *
 * Modal for selecting a duplicate lead and merging it into the primary lead.
 * Supports merge reason and displays preview of both records.
 */
const LeadMergeModal: React.FC<LeadMergeModalProps> = ({
  primaryLead,
  duplicateLeads,
  onMergeSuccess,
  onClose,
}) => {
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<number | null>(null);
  const [mergeReason, setMergeReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDuplicate = duplicateLeads.find((l) => l.id === selectedDuplicateId) ?? null;

  const handleMerge = async () => {
    if (!selectedDuplicateId) {
      setError('Vui lòng chọn lead cần gộp.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await leadApi.mergeLeads({
        primary_lead_id: primaryLead.id,
        secondary_lead_id: selectedDuplicateId,
        merge_reason: mergeReason || undefined,
      });
      onMergeSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gộp lead thất bại. Vui lòng thử lại.';
      setError(message);
      console.error('Merge failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldComparison = (label: string, primaryValue: string | null, duplicateValue: string | null) => (
    <tr key={label}>
      <td className="merge-compare__label">{label}</td>
      <td className={`merge-compare__primary ${!primaryValue ? 'merge-compare__empty' : ''}`}>
        {primaryValue ?? '(trống)'}
      </td>
      <td className={`merge-compare__secondary ${!duplicateValue ? 'merge-compare__empty' : ''}`}>
        {duplicateValue ?? '(trống)'}
      </td>
      <td className="merge-compare__result">
        {primaryValue || duplicateValue || '(trống)'}
      </td>
    </tr>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <header className="modal__header">
          <h2>Gộp Lead trùng lặp</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal__body">
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          {/* Step 1: Select duplicate */}
          <section className="merge-step">
            <h3>Bước 1: Chọn lead cần gộp</h3>
            <p className="merge-step__desc">
              Lead được chọn sẽ được gộp vào lead chính &quot;{primaryLead.full_name}&quot;.
              Toàn bộ lịch sử hoạt động sẽ được giữ nguyên.
            </p>
            <div className="merge-step__options">
              {duplicateLeads.map((dup) => (
                <label key={dup.id} className="merge-option">
                  <input
                    type="radio"
                    name="duplicate_lead"
                    value={dup.id}
                    checked={selectedDuplicateId === dup.id}
                    onChange={() => setSelectedDuplicateId(dup.id)}
                  />
                  <div className="merge-option__info">
                    <strong>{dup.full_name}</strong>
                    <span>{dup.email ?? ''} {dup.phone_number ?? ''}</span>
                    <span>{dup.company_name ?? ''}</span>
                    <span className={`badge badge--${dup.status}`}>{dup.status}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Step 2: Compare & Preview */}
          {selectedDuplicate && (
            <section className="merge-step">
              <h3>Bước 2: Xem trước kết quả gộp</h3>
              <p className="merge-step__desc">
                Các trường trống ở lead chính sẽ được bổ sung từ lead phụ.
              </p>
              <table className="merge-compare">
                <thead>
                  <tr>
                    <th>Trường</th>
                    <th>Lead chính</th>
                    <th>Lead gộp</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {renderFieldComparison('Email', primaryLead.email, selectedDuplicate.email)}
                  {renderFieldComparison('Số điện thoại', primaryLead.phone_number, selectedDuplicate.phone_number)}
                  {renderFieldComparison('Công ty', primaryLead.company_name, selectedDuplicate.company_name)}
                  {renderFieldComparison('Chức danh', primaryLead.job_title, selectedDuplicate.job_title)}
                  {renderFieldComparison('Nguồn', primaryLead.source, selectedDuplicate.source)}
                  {renderFieldComparison('Ghi chú', primaryLead.notes, selectedDuplicate.notes)}
                </tbody>
              </table>
            </section>
          )}

          {/* Step 3: Merge reason */}
          {selectedDuplicate && (
            <section className="merge-step">
              <h3>Bước 3: Lý do gộp (tuỳ chọn)</h3>
              <textarea
                className="form-textarea"
                placeholder="Nhập lý do gộp lead..."
                value={mergeReason}
                onChange={(e) => setMergeReason(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </section>
          )}
        </div>

        <footer className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Huỷ
          </button>
          <button
            className="btn btn--danger"
            onClick={handleMerge}
            disabled={loading || !selectedDuplicateId}
          >
            {loading ? 'Đang gộp...' : 'Xác nhận gộp Lead'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LeadMergeModal;

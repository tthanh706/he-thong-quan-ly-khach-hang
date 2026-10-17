import type { Lead, LeadAction, LeadHistory } from '../../types/lead';

interface LeadHistoryModalProps {
  lead: Lead | null;
  history: LeadHistory[];
  loading: boolean;
  onClose: () => void;
}

const actionLabels: Record<LeadAction, string> = {
  assigned: 'Được phân công',
  accepted: 'Đã nhận lead',
  rejected: 'Đã từ chối',
  contacted: 'Đã liên hệ',
  sla_overdue: 'Quá hạn SLA',
};

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function LeadHistoryModal({ lead, history, loading, onClose }: LeadHistoryModalProps) {
  if (!lead) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-card modal-card-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">LỊCH SỬ XỬ LÝ</p>
            <h2 id="history-title">{lead.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Đang tải lịch sử...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">Lead chưa có lịch sử xử lý.</div>
        ) : (
          <div className="timeline">
            {history.map((item) => (
              <article className="timeline-item" key={item.id}>
                <span className={`timeline-dot action-${item.action}`} />
                <div className="timeline-content">
                  <div className="timeline-title-row">
                    <strong>{actionLabels[item.action]}</strong>
                    <time>{formatDate(item.created_at)}</time>
                  </div>
                  <p>
                    {item.user ? `${item.user.name} (${item.user.email})` : 'Hệ thống'}
                  </p>
                  {(item.old_status || item.new_status) && (
                    <p className="muted">
                      {item.old_status ?? '—'} → {item.new_status ?? '—'}
                    </p>
                  )}
                  {item.reason && <p className="history-reason">{item.reason}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

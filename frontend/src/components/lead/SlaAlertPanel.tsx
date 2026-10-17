import type { SlaAlert } from '../../types/lead';

interface SlaAlertPanelProps {
  alerts: SlaAlert[];
  loading: boolean;
  onRefresh: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SlaAlertPanel({ alerts, loading, onRefresh }: SlaAlertPanelProps) {
  return (
    <section className="panel alert-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRƯỞNG NHÓM</p>
          <h2>Cảnh báo SLA</h2>
        </div>
        <button className="button button-secondary button-small" type="button" onClick={onRefresh}>
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Đang tải cảnh báo...</div>
      ) : alerts.length === 0 ? (
        <div className="empty-state success-empty">Không có lead quá hạn SLA.</div>
      ) : (
        <div className="alert-list">
          {alerts.map((alert) => (
            <article className="alert-item" key={alert.id}>
              <div className="alert-icon">!</div>
              <div>
                <strong>{alert.lead?.name ?? `Lead #${alert.lead_id}`}</strong>
                <p>Chưa liên hệ trong thời hạn SLA.</p>
                <span>Quá hạn lúc {formatDate(alert.overdue_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

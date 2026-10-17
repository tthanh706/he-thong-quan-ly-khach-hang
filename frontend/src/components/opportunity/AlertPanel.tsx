import type { OpportunityAlert } from '../../types/opportunity';

interface Props { alerts: OpportunityAlert[]; }

export default function AlertPanel({ alerts }: Props) {
  return (
    <section className="panel">
      <div className="section-title"><div><h2>Cảnh báo gần đây</h2><p>Danh sách cảnh báo gửi tới trưởng nhóm.</p></div></div>
      {alerts.length === 0 ? (
        <div className="empty-state">Chưa có cảnh báo.</div>
      ) : (
        <div className="alert-list">
          {alerts.slice(0, 8).map((alert) => (
            <div className="alert-item" key={alert.id}>
              <span className={`alert-dot ${alert.type}`}></span>
              <div>
                <strong>{alert.opportunity?.name ?? 'Cơ hội'}</strong>
                <p>{alert.message}</p>
                <small>{alert.detected_at ? new Date(alert.detected_at).toLocaleString('vi-VN') : '-'}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

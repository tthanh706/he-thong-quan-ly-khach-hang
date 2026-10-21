import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { HandoverLog } from '../types';

export function LogsPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [logs, setLogs] = useState<HandoverLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<{ data: HandoverLog[] }>('/handover-logs')
      .then((r) => {
        if (r && Array.isArray(r.data)) {
          setLogs(r.data);
        } else {
          setLogs([]);
        }
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      {!hideHeader && (
        <div className="page-title">
          <div>
            <h2>Lịch sử bàn giao</h2>
            <p>Nhật ký từng khách hàng và cơ hội được chuyển giao khi khóa tài khoản.</p>
          </div>
        </div>
      )}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Dữ liệu</th>
              <th>Từ</th>
              <th>Sang</th>
              <th>Người thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(logs) && logs.map((log) => (
              <tr key={log.id}>
                <td>{log.handed_over_at ? new Date(log.handed_over_at).toLocaleString('vi-VN') : '—'}</td>
                <td>{log.entity_type === 'customer' ? 'Khách hàng' : 'Cơ hội'} #{log.entity_id}</td>
                <td>{log.source_user?.name ?? '—'}</td>
                <td>{log.target_user?.name ?? '—'}</td>
                <td>{log.performed_by?.name ?? 'Quản trị viên'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Đang tải lịch sử bàn giao...</div>}
        {!loading && logs.length === 0 && <div className="empty">Chưa có lịch sử bàn giao.</div>}
      </div>
    </section>
  );
}

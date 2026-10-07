import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { HandoverLog } from '../types';

export function LogsPage() {
  const [logs, setLogs] = useState<HandoverLog[]>([]);

  useEffect(() => {
    void api<{ data: HandoverLog[] }>('/handover-logs').then((r) => setLogs(r.data));
  }, []);

  return (
    <section>
      <div className="page-title">
        <div>
          <h2>Lịch sử bàn giao</h2>
          <p>Nhật ký từng khách hàng và cơ hội được chuyển giao khi khóa tài khoản.</p>
        </div>
      </div>
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
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.handed_over_at).toLocaleString('vi-VN')}</td>
                <td>{log.entity_type === 'customer' ? 'Khách hàng' : 'Cơ hội'} #{log.entity_id}</td>
                <td>{log.source_user.name}</td>
                <td>{log.target_user.name}</td>
                <td>{log.performed_by?.name ?? 'Quản trị viên'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty">Chưa có lịch sử bàn giao.</div>}
      </div>
    </section>
  );
}

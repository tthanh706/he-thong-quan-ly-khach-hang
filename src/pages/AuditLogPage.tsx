import React, { useState } from 'react';

// Định nghĩa kiểu dữ liệu trực tiếp trong file để tránh lỗi import
interface AuditLogItem {
  id: number;
  username: string;
  action: string;
  targetModule: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export default function AuditLogPage() {
  const [logs] = useState<AuditLogItem[]>([
    {
      id: 1,
      username: 'admin_sys',
      action: 'UPDATE_SENSITIVE_DATA',
      targetModule: 'Customer',
      oldValue: 'Mã số thuế: 0101234567',
      newValue: 'Mã số thuế: 0109999999',
      timestamp: '2026-06-06 10:30:15',
    },
    {
      id: 2,
      username: 'manager_sale',
      action: 'DELETE_CONTRACT',
      targetModule: 'Contract',
      oldValue: 'Hợp đồng #HĐ-05',
      newValue: 'Đã xóa',
      timestamp: '2026-06-06 09:15:00',
    }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
            Nhật Ký Thay Đổi (Audit Log)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0' }}>
          Theo dõi lịch sử thao tác trên dữ liệu nhạy cảm của hệ thống.
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '12px' }}>Thời gian</th>
            <th style={{ padding: '12px' }}>Người thực hiện</th>
            <th style={{ padding: '12px' }}>Hành động</th>
            <th style={{ padding: '12px' }}>Module</th>
            <th style={{ padding: '12px' }}>Dữ liệu thay đổi</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', color: '#64748b' }}>{log.timestamp}</td>
              <td style={{ padding: '12px', fontWeight: '600', color: '#0284c7' }}>{log.username}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                  {log.action}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{log.targetModule}</td>
              <td style={{ padding: '12px', color: '#334155' }}>
                <span style={{ color: '#dc2626' }}>{log.oldValue}</span> ➔ <span style={{ color: '#16a34a' }}>{log.newValue}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
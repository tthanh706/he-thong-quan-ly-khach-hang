import React, { useState } from 'react';
import AuditLogPage from './AuditLogPage';
import { LogsPage } from './LogsPage';

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'handover'>('audit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Nhật ký Hệ thống & Giám sát
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Theo dõi toàn bộ lịch sử chỉnh sửa dữ liệu nhạy cảm và lịch sử bàn giao tài sản khi khóa tài khoản.
          </p>
        </div>
      </div>

      <div className="tabs" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          className={activeTab === 'audit' ? 'selected' : ''}
          onClick={() => setActiveTab('audit')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          📜 Nhật ký thay đổi dữ liệu (Audit Log)
        </button>
        <button
          className={activeTab === 'handover' ? 'selected' : ''}
          onClick={() => setActiveTab('handover')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          🧾 Lịch sử bàn giao tài khoản
        </button>
      </div>

      <div>
        {activeTab === 'audit' ? <AuditLogPage /> : <LogsPage />}
      </div>
    </div>
  );
}

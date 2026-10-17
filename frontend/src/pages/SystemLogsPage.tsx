import React, { useState } from 'react';
import AuditLogPage from './AuditLogPage';
import { LogsPage } from './LogsPage';

export default function SystemLogsPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'handover'>('audit');

  return (
    <section>
      <div className="page-title">
        <div>
          <h2>Nhật ký Hệ thống & Giám sát</h2>
          <p>Theo dõi toàn bộ lịch sử chỉnh sửa dữ liệu nhạy cảm và lịch sử bàn giao tài sản khi khóa tài khoản.</p>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'audit' ? 'selected' : ''}
          onClick={() => setActiveTab('audit')}
        >
          📜 Nhật ký thay đổi dữ liệu (Audit Log)
        </button>
        <button
          className={activeTab === 'handover' ? 'selected' : ''}
          onClick={() => setActiveTab('handover')}
        >
          🧾 Lịch sử bàn giao tài khoản
        </button>
      </div>

      <div>
        {activeTab === 'audit' ? <AuditLogPage hideHeader /> : <LogsPage hideHeader />}
      </div>
    </section>
  );
}

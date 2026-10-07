import React from 'react';
import AuditLogPage from '../pages/AuditLogPage';
import CustomFieldsPage from '../pages/CustomFieldsPage';

interface RoutesProps {
  activeTab: string;
}

export default function Routes({ activeTab }: RoutesProps) {
  switch (activeTab) {
    case 'audit-log':
      return <AuditLogPage />;
    case 'custom-fields':
      return <CustomFieldsPage />;
    default:
      return (
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Module: {activeTab.toUpperCase()}</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Đang hiển thị nội dung phân hệ CRM chuẩn.</p>
        </div>
      );
  }
}
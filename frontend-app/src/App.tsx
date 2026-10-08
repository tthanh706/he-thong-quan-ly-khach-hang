import React, { useState } from 'react';
import Routes from './routes';

export default function App() {
  const [activeTab, setActiveTab] = useState('audit-log');

  const tabs = [
    'audit-log'
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '30px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Hệ Thống CRM (Sprint 2)</h1>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab ? '#0284c7' : '#e2e8f0',
                  color: activeTab === tab ? '#fff' : '#475569',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'audit-log' ? 'S2-04: Audit Log' : tab === 'custom-fields' ? 'S2-08: Custom Fields' : tab}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '30px' }}>
          <Routes activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
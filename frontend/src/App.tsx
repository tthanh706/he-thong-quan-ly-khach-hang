import { OrgPage } from './pages/OrgPage';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Header */}
      <header style={{ 
        height: '56px', 
        backgroundColor: '#0f172a', 
        color: '#ffffff', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 24px',
        borderBottom: '1px solid #1e293b'
      }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
          HỆ THỐNG QUẢN LÝ KHÁCH HÀNG (CRM)
        </h1>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          Vai trò: <span style={{ color: '#ffffff', fontWeight: 500 }}>Giám đốc kinh doanh</span>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Left */}
        <aside style={{ width: '240px', backgroundColor: '#1e293b', color: '#cbd5e1', padding: '20px 12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', padding: '0 8px 12px 8px', letterSpacing: '0.5px' }}>
            DANH MỤC & CẤU HÌNH
          </div>
          
          <button 
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: '6px', 
              border: 'none', 
              backgroundColor: '#2563eb', 
              color: '#ffffff', 
              cursor: 'pointer', 
              textAlign: 'left', 
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏢 Cơ cấu Tổ chức
          </button>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, backgroundColor: '#f8fafc', padding: '24px 32px' }}>
          <OrgPage />
        </main>
      </div>
    </div>
  );
}

export default App;
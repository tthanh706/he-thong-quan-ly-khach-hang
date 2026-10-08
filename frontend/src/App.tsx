import { useState } from 'react';
import { ProductPage } from './pages/ProductPage';
import { CategoryPage } from './pages/CategoryPage';
import { Package, Tag } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CATEGORIES'>('PRODUCTS');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>HỆ THỐNG QUẢN LÝ KHÁCH HÀNG (CRM)</h1>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Vai trò: Giám đốc kinh doanh</span>
      </header>

      {/* Main Layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 53px)' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', backgroundColor: '#1e293b', padding: '20px 12px', color: '#fff' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', paddingLeft: '12px', marginBottom: '12px', letterSpacing: '0.05em' }}>
            DANH MỤC & CẤU HÌNH
          </div>
          
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            style={navItemStyle(activeTab === 'PRODUCTS')}
          >
            <Package size={18} />
            <span>Sản phẩm & Bảng giá</span>
          </button>

          <button
            onClick={() => setActiveTab('CATEGORIES')}
            style={navItemStyle(activeTab === 'CATEGORIES')}
          >
            <Tag size={18} />
            <span>Danh mục dùng chung</span>
          </button>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px', backgroundColor: '#ffffff' }}>
          {activeTab === 'PRODUCTS' ? <ProductPage /> : <CategoryPage />}
        </main>
      </div>
    </div>
  );
}

const navItemStyle = (active: boolean): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textAlign: 'left',
  padding: '12px 14px',
  marginBottom: '6px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: active ? '#2563eb' : 'transparent',
  color: active ? '#ffffff' : '#cbd5e1',
  fontSize: '14px',
  fontWeight: active ? '600' : '400',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

export default App;
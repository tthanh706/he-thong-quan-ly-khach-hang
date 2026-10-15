import ExcelImportPage from './pages/ExcelImportPage';
import SupportRequestPage from './pages/SupportRequestPage';
import PeriodicCarePage from './pages/PeriodicCarePage';

function App() {
  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>
        Hệ Thống CRM - Giao Diện Sprint (Dương Anh Hoan)
      </h1>

      {/* Hiển thị cả 3 giao diện trực tiếp để gọi đầy đủ cả 3 component */}
      <ExcelImportPage />
      <SupportRequestPage />
      <PeriodicCarePage />
    </div>
  );
}

export default App;
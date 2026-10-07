import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LogOut, AlertTriangle } from 'lucide-react';
import { api } from './services/api';
import type { User } from './types';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { AccountPage } from './pages/AccountPage';
import { DataPage } from './pages/DataPage';
import UserImportPage from './pages/UserImportPage';
import ProfilePage from './pages/ProfilePage';
import ErrorPage from './pages/ErrorPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrgPage from './pages/OrgPage';
import CustomFieldsPage from './pages/CustomFieldsPage';
import SalesProcessPage from './pages/SalesProcessPage';
import SystemLogsPage from './pages/SystemLogsPage';
import './styles.css';

type Page =
  | 'data'
  | 'products'
  | 'sales-process'
  | 'accounts'
  | 'import-users'
  | 'org'
  | 'categories'
  | 'custom-fields'
  | 'system-logs'
  | 'profile'
  | 'error';

const PAGE_TITLES: Record<Page, string> = {
  data: '📁 Dữ liệu sở hữu',
  products: '📦 Quản lý Sản phẩm & Bảng giá',
  'sales-process': '📈 Quy trình & Thiết lập Bán hàng',
  accounts: '👥 Quản lý Nhân sự & Tài khoản',
  'import-users': '📥 Nhập Nhân viên từ Excel',
  org: '🏢 Cơ cấu Tổ chức Doanh nghiệp',
  categories: '🏷️ Quản lý Danh mục dùng chung',
  'custom-fields': '🎛️ Quản lý Trường dữ liệu tùy chỉnh',
  'system-logs': '📜 Nhật ký Hệ thống & Giám sát',
  profile: '⚙️ Thông tin & Hồ sơ Cá nhân',
  error: '⚠️ Trang thông báo lỗi hệ thống',
};

function parseLocation(): { page: Page; errorStatus: number | null } {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);
  const queryStatus = Number(searchParams.get('status'));

  if (queryStatus && [401, 402, 403, 404, 419, 500].includes(queryStatus)) {
    return { page: 'error', errorStatus: queryStatus };
  }

  if (['401', '402', '403', '404', '419', '500'].includes(path)) {
    return { page: 'error', errorStatus: Number(path) };
  }

  // Điều hướng tương thích cho các đường dẫn cũ sang trang gộp
  if (path === 'pipeline' || path === 'win-loss') {
    return { page: 'sales-process', errorStatus: null };
  }
  if (path === 'logs' || path === 'audit-logs') {
    return { page: 'system-logs', errorStatus: null };
  }

  const validPages: Page[] = [
    'data',
    'products',
    'sales-process',
    'accounts',
    'import-users',
    'org',
    'categories',
    'custom-fields',
    'system-logs',
    'profile',
  ];

  if (validPages.includes(path as Page)) {
    return { page: path as Page, errorStatus: null };
  }

  if (path === 'error') {
    return { page: 'error', errorStatus: 404 };
  }

  if (path && path !== 'login' && path !== 'dashboard' && path !== '') {
    return { page: 'error', errorStatus: 404 };
  }

  return { page: 'accounts', errorStatus: null };
}

export default function App() {
  const { user, setUser, logout: authLogout } = useAuth();
  const [checking, setChecking] = useState(true);

  const initialLoc = parseLocation();
  const [page, setPage] = useState<Page>(initialLoc.page);
  const [errorStatus, setErrorStatus] = useState<number | null>(initialLoc.errorStatus);

  const navigateTo = (newPage: Page, statusCode: number | null = null) => {
    setPage(newPage);
    setErrorStatus(statusCode);
    if (newPage === 'error' && statusCode) {
      window.history.pushState(null, '', `/${statusCode}`);
    } else {
      window.history.pushState(null, '', `/${newPage === 'accounts' ? '' : newPage}`);
    }
  };

  const showError = (code: number) => {
    navigateTo('error', code);
  };

  useEffect(() => {
    const handlePopState = () => {
      const loc = parseLocation();
      setPage(loc.page);
      setErrorStatus(loc.errorStatus);
    };

    const handleHttpError = (e: Event) => {
      const customEvent = e as CustomEvent<{ statusCode: number }>;
      const code = customEvent.detail?.statusCode;
      if (code && [401, 402, 403, 404, 500].includes(code)) {
        showError(code);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app:http-error', handleHttpError);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app:http-error', handleHttpError);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) { setChecking(false); return; }
    void api<{ user: User }>('/me')
      .then((result) => setUser(result.user))
      .catch(() => {
        localStorage.removeItem('session_token');
        localStorage.removeItem('auth-store');
        setUser(null as any);
      })
      .finally(() => setChecking(false));
  }, [setUser]);

  async function handleLogout() {
    localStorage.removeItem('session_token');
    localStorage.removeItem('auth-store');
    sessionStorage.clear();
    setUser(null as any);
    setErrorStatus(null);
    if (page === 'error') {
      setPage('accounts');
    }
    window.history.pushState(null, '', '/login');

    try {
      await authLogout();
    } catch {
      // Bỏ qua lỗi backend nếu có
    }
    toast.success('Đã đăng xuất thành công!');
  }

  if (checking) return <div className="loading-screen">Đang tải...</div>;

  // Khi chưa đăng nhập nhưng URL yêu cầu xem trang lỗi (ví dụ /404, /401, /500)
  if (!user && page === 'error') {
    return (
      <div className="auth-page">
        <Toaster position="top-right" />
        <ErrorPage
          statusCode={errorStatus ?? 404}
          onNavigate={(url) => {
            if (url === '/login' || url === '/accounts' || url === '/dashboard') {
              navigateTo('accounts');
              window.history.pushState(null, '', '/login');
            } else if (url === '__BACK__') {
              window.history.back();
            } else if (url === '__RELOAD__') {
              window.location.reload();
            } else {
              window.location.href = url;
            }
          }}
        />
      </div>
    );
  }

  // Khi chưa đăng nhập: Hiển thị trang đăng nhập
  if (!user) {
    return (
      <LoginPage
        onLogin={(loggedUser) => {
          if (loggedUser) {
            setUser(loggedUser);
            navigateTo('accounts');
          } else {
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" />
      <aside className="sidebar">
        <div className="brand">Quản Lý Khách Hàng</div>
        <div className="side-caption">Cổng Thông Tin Quản Trị Doanh Nghiệp</div>

        <nav>
          {/* PHÂN HỆ 1: KINH DOANH & BÁN HÀNG */}
          <div className="sidebar-section-title">Kinh doanh & Bán hàng</div>
          <button className={page === 'data' ? 'active' : ''} onClick={() => navigateTo('data')}>
            📁 Dữ liệu sở hữu
          </button>
          <button className={page === 'products' ? 'active' : ''} onClick={() => navigateTo('products')}>
            📦 Sản phẩm & Bảng giá
          </button>
          <button className={page === 'sales-process' ? 'active' : ''} onClick={() => navigateTo('sales-process')}>
            📈 Quy trình bán hàng
          </button>

          {/* PHÂN HỆ 2: TỔ CHỨC & NHÂN SỰ */}
          <div className="sidebar-section-title">Tổ chức & Nhân sự</div>
          <button className={page === 'accounts' ? 'active' : ''} onClick={() => navigateTo('accounts')}>
            👥 Quản lý tài khoản
          </button>
          {user.role === 'admin' && (
            <button className={page === 'import-users' ? 'active' : ''} onClick={() => navigateTo('import-users')}>
              📥 Nhập nhân viên từ Excel
            </button>
          )}
          <button className={page === 'org' ? 'active' : ''} onClick={() => navigateTo('org')}>
            🏢 Cơ cấu tổ chức
          </button>

          {/* PHÂN HỆ 3: CẤU HÌNH & TÙY BIẾN */}
          {user.role === 'admin' && (
            <>
              <div className="sidebar-section-title">Cấu hình & Tùy biến</div>
              <button className={page === 'categories' ? 'active' : ''} onClick={() => navigateTo('categories')}>
                🏷️ Danh mục dùng chung
              </button>
              <button className={page === 'custom-fields' ? 'active' : ''} onClick={() => navigateTo('custom-fields')}>
                🎛️ Trường tùy chỉnh
              </button>
            </>
          )}

          {/* PHÂN HỆ 4: GIÁM SÁT & NHẬT KÝ */}
          <div className="sidebar-section-title">Giám sát & Nhật ký</div>
          <button className={page === 'system-logs' ? 'active' : ''} onClick={() => navigateTo('system-logs')}>
            📜 Nhật ký hệ thống
          </button>

          {/* PHÂN HỆ 5: CÁ NHÂN */}
          <div className="sidebar-section-title">Cá nhân</div>
          <button className={page === 'profile' ? 'active' : ''} onClick={() => navigateTo('profile')}>
            ⚙️ Thông tin cá nhân
          </button>
        </nav>

        {/* CÔNG CỤ TEST MÃ LỖI (Thu gọn tinh tế ở chân trang) */}
        <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
          <details style={{ fontSize: '11px', color: '#85819d', padding: '0 6px' }}>
            <summary style={{ cursor: 'pointer', userSelect: 'none', padding: '4px 0', outline: 'none' }}>
              🛠️ Kiểm thử mã lỗi HTTP
            </summary>
            <div className="sidebar-error-nav" style={{ marginTop: '8px' }}>
              <button
                className={page === 'error' && errorStatus === 401 ? 'active' : ''}
                onClick={() => showError(401)}
                title="Lỗi 401 - Chưa đăng nhập"
              >
                <AlertTriangle size={11} /> 401
              </button>
              <button
                className={page === 'error' && errorStatus === 402 ? 'active' : ''}
                onClick={() => showError(402)}
                title="Lỗi 402 - Yêu cầu thanh toán"
              >
                <AlertTriangle size={11} /> 402
              </button>
              <button
                className={page === 'error' && errorStatus === 404 ? 'active' : ''}
                onClick={() => showError(404)}
                title="Lỗi 404 - Không tìm thấy trang"
              >
                <AlertTriangle size={11} /> 404
              </button>
              <button
                className={page === 'error' && errorStatus === 500 ? 'active' : ''}
                onClick={() => showError(500)}
                title="Lỗi 500 - Lỗi máy chủ"
              >
                <AlertTriangle size={11} /> 500
              </button>
            </div>
          </details>
        </div>

        {/* THÔNG TIN USER & ĐĂNG XUẤT */}
        <div className="sidebar-bottom">
          <div 
            onClick={() => navigateTo('profile')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', overflow: 'hidden' }}
            title="Xem hồ sơ cá nhân"
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                user.name?.[0]?.toUpperCase() ?? 'U'
              )}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.role ?? 'Thành viên'}</div>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-logout-btn" 
            onClick={() => void handleLogout()} 
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="main-layout">
        <header className="app-topbar">
          <div className="topbar-left">
            <span className="topbar-page-name">
              {page === 'error' ? `⚠️ Lỗi hệ thống: HTTP ${errorStatus ?? 404}` : PAGE_TITLES[page]}
            </span>
          </div>
          <div className="topbar-right">
            <div className="topbar-user" onClick={() => navigateTo('profile')} title="Xem hồ sơ cá nhân">
              <div className="topbar-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  user.name?.[0]?.toUpperCase() ?? 'U'
                )}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-name">{user.name}</span>
                <span className="topbar-role">{user.role ?? 'Thành viên'}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="topbar-logout-btn" 
              onClick={() => void handleLogout()} 
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </header>

        <main className="content">
          {page === 'data' && <DataPage />}
          {page === 'products' && <ProductsPage />}
          {page === 'sales-process' && <SalesProcessPage />}
          {page === 'accounts' && <AccountPage />}
          {page === 'import-users' && <UserImportPage />}
          {page === 'org' && <OrgPage />}
          {page === 'categories' && <CategoriesPage />}
          {page === 'custom-fields' && <CustomFieldsPage />}
          {page === 'system-logs' && <SystemLogsPage />}
          {page === 'profile' && <ProfilePage onLogout={handleLogout} />}
          {page === 'error' && (
            <ErrorPage
              statusCode={errorStatus ?? 404}
              onNavigate={(url) => {
                if (url === '/login') {
                  handleLogout();
                } else if (url === '/accounts' || url === '/dashboard') {
                  navigateTo('accounts');
                } else if (url === '__BACK__') {
                  navigateTo('accounts');
                } else if (url === '__RELOAD__') {
                  window.location.reload();
                } else {
                  navigateTo('accounts');
                }
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

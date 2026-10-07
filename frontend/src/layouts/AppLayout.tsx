import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Users, Megaphone, LogOut, ChevronRight, Bell, UserPlus, History, Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/customers', label: 'Khách hàng', icon: Users },
  { to: '/campaigns', label: 'Chiến dịch', icon: Megaphone },
  { to: '/audit-logs', label: 'Nhật ký thay đổi', icon: History },
  { to: '/custom-fields', label: 'Trường tùy chỉnh', icon: Sliders },
];

export default function AppLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">CRM</span>
          <span className="logo-text">Quản lý KH</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item--active' : ''}`
            }>
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/users/import" className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item--active' : ''}`
            }>
              <UserPlus size={18} />
              <span>Nhập nhân viên</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="user-info" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
            <div className="avatar" style={{ overflow: 'hidden' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </Link>
          <button onClick={handleLogout} className="logout-btn" title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-bar">
          <div className="top-bar-right">
            <button className="icon-btn" aria-label="Thông báo"><Bell size={18} /></button>
          </div>
        </header>
        <main className="page-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

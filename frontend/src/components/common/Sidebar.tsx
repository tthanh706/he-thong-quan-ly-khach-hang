import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Permission } from '../../types';
import './Sidebar.css';

type Item = { label: string; path: string; icon: string; permission: Permission };
const items: Item[] = [
  { label: 'Tổng quan', path: '/', icon: '⌂', permission: 'dashboard.view' },
  { label: 'Khách hàng', path: '/customers', icon: '♙', permission: 'customers.view' },
  { label: 'Chiến dịch', path: '/campaigns', icon: '◈', permission: 'campaigns.view' },
  { label: 'Báo cáo', path: '/reports', icon: '▤', permission: 'reports.view' },
  { label: 'Người dùng', path: '/users', icon: '⚙', permission: 'users.manage' },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  return (
    <>
      {open && <button className="backdrop" onClick={onClose} aria-label="Đóng menu" />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <b>CRM</b>
          <span>Portal</span>
        </div>
        <nav>
          {items.map((i) => (
            <NavLink
              key={i.path}
              to={i.path}
              end={i.path === '/'}
              onClick={onClose}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span>{i.icon}</span>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="profile">
          <div className="avatar">{user?.name ? user.name.charAt(0) : 'U'}</div>
          <div className="profile-text">
            <b>{user?.name}</b>
            <span>{user?.role}</span>
            <small>{user?.businessGroup?.name ?? ''}</small>
          </div>
          <button onClick={() => void logout()} aria-label="Đăng xuất">
            ↪
          </button>
        </div>
      </aside>
    </>
  );
}

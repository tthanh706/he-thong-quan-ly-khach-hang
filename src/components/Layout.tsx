import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { ROLE_LABEL, SCOPE_LABEL } from '../types';
import { ScopeBadge } from './ScopeBadge';
import { initials } from '../utils/format';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tổng quan', icon: '◧' },
  { to: '/customers', label: 'Khách hàng', icon: 'KH' },
  { to: '/opportunities', label: 'Cơ hội', icon: 'CO' },
  { to: '/activities', label: 'Hoạt động', icon: 'HD' },
  { to: '/quotes', label: 'Báo giá', icon: 'BG' },
  { to: '/access-checks', label: 'Kiểm thử phân quyền', icon: '✓' },
];

export function Layout() {
  const { user, users, scope, allowedScopes, teamName, setScope, switchUser, logout } = useSession();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">S5</span>
          <div>
            <strong>SCRUM-5</strong>
            <small>Phân quyền dữ liệu sở hữu</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <span className="nav-item__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p>
            Đang đăng nhập: <strong>{user.name}</strong>
          </p>
          <p>
            {ROLE_LABEL[user.role]} · {teamName}
          </p>
        </div>
      </aside>

      <div className="app__main">
        <header className="topbar">
          <div className="topbar__scope">
            <label htmlFor="scope-select">Phạm vi dữ liệu</label>
            <select
              id="scope-select"
              value={scope}
              onChange={(event) => setScope(event.target.value as typeof scope)}
            >
              {allowedScopes.map((item) => (
                <option key={item} value={item}>
                  {SCOPE_LABEL[item]}
                </option>
              ))}
            </select>
            <ScopeBadge scope={scope} />
          </div>

          <div className="topbar__user">
            <div className="switcher">
              <button
                type="button"
                className="switcher__button"
                onClick={() => setSwitcherOpen((open) => !open)}
              >
                <span className="avatar" style={{ background: user.avatarColor }}>
                  {initials(user.name)}
                </span>
                <span className="switcher__text">
                  <strong>{user.name}</strong>
                  <small>{ROLE_LABEL[user.role]}</small>
                </span>
                <span aria-hidden="true">▾</span>
              </button>

              {switcherOpen && (
                <div className="switcher__menu">
                  <p className="switcher__hint">Chuyển đổi tài khoản để so sánh phạm vi dữ liệu</p>
                  {users.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`switcher__item${item.id === user.id ? ' switcher__item--active' : ''}`}
                      onClick={() => {
                        switchUser(item.id);
                        setSwitcherOpen(false);
                        navigate('/dashboard');
                      }}
                    >
                      <span className="avatar avatar--sm" style={{ background: item.avatarColor }}>
                        {initials(item.name)}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {ROLE_LABEL[item.role]} · mặc định{' '}
                          {SCOPE_LABEL[
                            item.role === 'employee' ? 'own' : item.role === 'team_lead' ? 'team' : 'all'
                          ].toLowerCase()}
                        </small>
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn--ghost btn--block"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

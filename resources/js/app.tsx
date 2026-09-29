import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';

type MenuItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
  roles: string[];
};

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label: string;
  business_group: string;
};

type MeResponse = { user: CurrentUser; menus: MenuItem[] };

function App() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/me', { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/login';
          return null;
        }
        if (!res.ok) throw new Error('Không thể tải thông tin người dùng');
        return res.json();
      })
      .then((value) => value && setData(value))
      .catch(console.error);
  }, []);

  const logout = async () => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    await fetch('/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': token ?? '',
        Accept: 'application/json',
      },
    });
    window.location.href = '/login';
  };

  if (!data) {
    return <div className="loading">Đang tải...</div>;
  }

  const { user, menus } = data;

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="icon-button" aria-label="Mở menu" onClick={() => setOpen(!open)}>☰</button>
        <strong>CRM</strong>
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
      </header>

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>CRM Portal</strong>
            <span>Business Management</span>
          </div>
        </div>

        <div className="profile-card">
          <div className="avatar large">{user.name.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <strong>{user.name}</strong>
            <span>{user.role_label}</span>
            <small>{user.business_group}</small>
          </div>
        </div>

        <nav className="menu" aria-label="Menu chính">
          {menus.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`menu-item ${window.location.pathname === item.href ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <button className="logout" onClick={logout}>↪ <span>Đăng xuất</span></button>
      </aside>

      {open && <button className="backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}

      <main className="content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Trang làm việc</p>
            <h1>Xin chào, {user.name}</h1>
            <p className="muted">Các chức năng bên dưới được hiển thị theo quyền của tài khoản.</p>
          </div>
          <div className="permission-badge">● {user.role_label}</div>
        </div>

        <section className="cards">
          <article className="info-card">
            <span className="card-label">Vai trò</span>
            <strong>{user.role_label}</strong>
            <small>Quyền truy cập được lọc từ máy chủ</small>
          </article>
          <article className="info-card">
            <span className="card-label">Nhóm kinh doanh</span>
            <strong>{user.business_group}</strong>
            <small>Nhóm hiện tại của tài khoản</small>
          </article>
          <article className="info-card">
            <span className="card-label">Menu khả dụng</span>
            <strong>{menus.length} chức năng</strong>
            <small>Chỉ hiển thị mục được cấp quyền</small>
          </article>
        </section>

        <section className="menu-preview">
          <div className="section-title">
            <div>
              <h2>Chức năng của bạn</h2>
              <p>Không hiển thị menu ngoài quyền được cấp.</p>
            </div>
          </div>
          <div className="feature-grid">
            {menus.map((item) => (
              <a href={item.href} className="feature" key={item.key}>
                <span className="feature-icon">{item.icon}</span>
                <span>
                  <strong>{item.label}</strong>
                  <small>Truy cập chức năng</small>
                </span>
                <span className="arrow">→</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('app')!).render(
  <React.StrictMode><App /></React.StrictMode>
);

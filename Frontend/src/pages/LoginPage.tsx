import { FormEvent, useState } from 'react';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLoggedIn: () => Promise<void>;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState('staff@s407.com');
  const [password, setPassword] = useState('Staff1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(email.trim(), password);
      await onLoggedIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark">CRM</div>
        <p className="eyebrow">HỆ THỐNG QUẢN LÝ KHÁCH HÀNG</p>
        <h1>Lead & SLA</h1>
        <p className="login-description">
          Nhận lead được phân công, từ chối có lý do và theo dõi cảnh báo quá hạn SLA.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <label className="field-label" htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="form-error">{error}</div>}

          <button className="button button-primary login-button" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="demo-note">
          <strong>Tài khoản test:</strong> staff@s407.com / Staff1234
        </div>
      </section>
    </main>
  );
}

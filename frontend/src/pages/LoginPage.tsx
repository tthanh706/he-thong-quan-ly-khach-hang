import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../services/api';
import type { User } from '../types';

export function LoginPage({ onLogin }: { onLogin: (user?: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      localStorage.setItem('session_token', result.session_token);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand">Quản Lý Khách Hàng</div>
        <h1>Đăng nhập hệ thống</h1>
        <p className="muted">Cổng Thông Tin Quản Trị Khách Hàng & Doanh Nghiệp.</p>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Nhập địa chỉ email..."
            autoComplete="email"
            required
          />
        </label>
        <label>
          Mật khẩu
          <div className="password-wrapper">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary full" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}

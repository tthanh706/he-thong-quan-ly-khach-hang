import { FormEvent, useState } from 'react';
import { login } from '../services/opportunityService';
import type { UserSummary } from '../types/opportunity';

interface Props {
  onLoggedIn: (user: UserSummary) => void;
}

export default function LoginView({ onLoggedIn }: Props) {
  const [email, setEmail] = useState('leader@s507.com');
  const [password, setPassword] = useState('Leader1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(email, password);
      localStorage.setItem('session_token', response.session_token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
      onLoggedIn(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">CRM</div>
        <h1>Hệ thống quản lý khách hàng</h1>
        <p>Đăng nhập để quản lý cảnh báo cơ hội đình trệ.</p>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <label>Mật khẩu</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />

        {error && <div className="error-box">{error}</div>}

        <button className="primary-button full" disabled={loading} type="submit">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

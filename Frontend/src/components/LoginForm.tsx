import { FormEvent, useState } from 'react';
import { CalendarDays, LockKeyhole, Mail } from 'lucide-react';
import { login } from '../services/calendarService';
import type { UserSummary } from '../types/calendar';

interface Props { onLogin: (user: UserSummary) => void; }

export default function LoginForm({ onLogin }: Props) {
  const [email, setEmail] = useState('leader@s607.com');
  const [password, setPassword] = useState('Leader1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const result = await login(email, password);
      localStorage.setItem('session_token', result.session_token);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally { setLoading(false); }
  }

  return <div className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="login-icon"><CalendarDays size={34}/></div>
    <h1>Lịch làm việc nhóm</h1><p>S6-07 · CRM</p>
    <label>Email</label><div className="input-icon"><Mail size={18}/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></div>
    <label>Mật khẩu</label><div className="input-icon"><LockKeyhole size={18}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></div>
    {error && <div className="error-box">{error}</div>}
    <button className="primary full" disabled={loading}>{loading?'Đang đăng nhập...':'Đăng nhập'}</button>
  </form></div>;
}

import { FormEvent, useState } from 'react';
import { Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { login, forgotPasswordApi, resetPasswordApi } from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';

export function LoginPage({ onLogin }: { onLogin: (user?: User) => void }) {
  // Chế độ: 'login' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Submit đăng nhập
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      localStorage.setItem('session_token', result.session_token);
      toast.success('Đăng nhập thành công!');
      onLogin(result.user);
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  // Submit Quên mật khẩu - gửi email lấy token
  async function handleSendResetLink(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Vui lòng nhập email tài khoản của bạn.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setError('Email không đúng định dạng.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await forgotPasswordApi(forgotEmail.trim());
      toast.success(res.message || 'Mã xác nhận đã được tạo.');
      if (res.token) {
        setForgotToken(res.token);
      }
      setForgotMessage(res.message);
      setMode('reset');
    } catch (err: any) {
      setError(err?.message || 'Không tìm thấy tài khoản với email này.');
    } finally {
      setLoading(false);
    }
  }

  // Submit Đặt lại mật khẩu mới
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!forgotToken.trim()) {
      setError('Vui lòng nhập mã xác nhận (Token).');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setError('Mật khẩu mới phải chứa ít nhất một chữ cái và một chữ số.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await resetPasswordApi({
        email: forgotEmail.trim(),
        token: forgotToken.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      toast.success(res.message || 'Đặt lại mật khẩu thành công!');
      setEmail(forgotEmail.trim());
      setPassword('');
      setMode('login');
      setForgotToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      {mode === 'login' && (
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="brand">Quản Lý Khách Hàng</div>
          <h1>Đăng nhập hệ thống</h1>
          <p className="muted">Cổng Thông Tin Quản Trị Khách Hàng & Doanh Nghiệp.</p>

          <label>
            Email
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => {
                setError('');
                setForgotEmail(email);
                setMode('forgot');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#7545d9',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Quên mật khẩu?
            </button>
          </div>

          {error && <div className="error" style={{ marginBottom: '14px' }}>{error}</div>}

          <button className="primary full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form className="auth-card" onSubmit={handleSendResetLink} noValidate>
          <button
            type="button"
            onClick={() => {
              setError('');
              setMode('login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              padding: 0,
              marginBottom: '14px',
            }}
          >
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </button>

          <div className="brand">Khôi Phục Mật Khẩu</div>
          <h1 style={{ fontSize: '24px' }}>Quên mật khẩu?</h1>
          <p className="muted">
            Nhập địa chỉ email đăng nhập của bạn để nhận mã xác nhận đặt lại mật khẩu mới.
          </p>

          <label>
            Địa chỉ email
            <input
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (error) setError('');
              }}
              type="email"
              placeholder="user@company.com"
              autoComplete="email"
              required
            />
          </label>

          {error && <div className="error" style={{ marginBottom: '14px' }}>{error}</div>}

          <button className="primary full" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form className="auth-card" onSubmit={handleResetPassword} noValidate>
          <button
            type="button"
            onClick={() => {
              setError('');
              setMode('forgot');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              padding: 0,
              marginBottom: '14px',
            }}
          >
            <ArrowLeft size={16} /> Nhập lại email
          </button>

          <div className="brand">Tạo Mật Khẩu Mới</div>
          <h1 style={{ fontSize: '24px' }}>Đặt lại mật khẩu</h1>
          {forgotMessage && (
            <p style={{ fontSize: '13px', color: '#16a34a', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              {forgotMessage}
            </p>
          )}

          <label>
            Mã xác nhận (Token) *
            <input
              value={forgotToken}
              onChange={(e) => {
                setForgotToken(e.target.value);
                if (error) setError('');
              }}
              type="text"
              placeholder="Dán mã token xác nhận..."
              required
            />
          </label>

          <label>
            Mật khẩu mới *
            <div className="password-wrapper">
              <input
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự, có chữ và số"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowNewPassword((prev) => !prev)}
                title={showNewPassword ? 'Ẩn' : 'Hiện'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Xác nhận mật khẩu mới *
            <input
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </label>

          {error && <div className="error" style={{ marginBottom: '14px' }}>{error}</div>}

          <button className="primary full" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      )}
    </main>
  );
}

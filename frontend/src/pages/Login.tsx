import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import type { LoginPayload } from '../types';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>();

  const onSubmit = async (data: LoginPayload) => {
    setLoading(true);
    try {
      await login(data);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.apiError?.message ?? 'Email hoặc mật khẩu không đúng.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-mark">CRM</span>
        </div>
        <h1 className="login-title">Đăng nhập hệ thống</h1>
        <p className="login-sub">Quản lý khách hàng & chiến dịch</p>

        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              placeholder="admin@example.com"
              {...register('email', {
                required: 'Email không được để trống',
                pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Email không hợp lệ' },
              })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-group">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Mật khẩu không được để trống', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
              />
              <button type="button" className="input-addon" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <label className="checkbox-label">
            <input type="checkbox" {...register('remember')} />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <LogIn size={16} />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

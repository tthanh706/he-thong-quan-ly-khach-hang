import { useState, useEffect, useRef } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { LogOut, Save, KeyRound, User as UserIcon, Lock } from 'lucide-react';
import { profileService } from '../services/profileService';
import { changePasswordApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

// Schema xác thực cho thông tin cá nhân
const profileSchema = z.object({
  name: z.string().min(1, 'Họ và tên không được để trống').max(255, 'Tối đa 255 ký tự'),
  phone: z
    .string()
    .refine(
      (val) => !val || /^(\+84|0)\d{9,10}$/.test(val.trim()),
      'Số điện thoại không đúng định dạng (VD: 0912345678 hoặc +84912345678)'
    )
    .nullable()
    .optional(),
  job_title: z.string().max(150, 'Chức danh không được vượt quá 150 ký tự').nullable().optional(),
  email_signature: z.string().max(2000, 'Chữ ký email tối đa 2000 ký tự').nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage({ onLogout }: { onLogout?: () => void } = {}) {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Thông tin cá nhân
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useRHForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      job_title: '',
      email_signature: '',
    },
  });

  // State cho Form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getProfile();
        const data = response.data;
        reset({
          name: data.name || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
          email_signature: data.email_signature || '',
        });
        setUser(data);
      } catch (error: any) {
        toast.error('Không thể tải thông tin cá nhân.');
      }
    };
    fetchProfile();
  }, [reset, setUser]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const response = await profileService.updateProfile({
        name: data.name.trim(),
        phone: data.phone ? data.phone.trim() : null,
        job_title: data.job_title ? data.job_title.trim() : null,
        email_signature: data.email_signature || null,
      });
      toast.success('Cập nhật hồ sơ cá nhân thành công!');
      setUser(response.data);
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await profileService.uploadAvatar(file);
      toast.success('Cập nhật ảnh đại diện thành công!');
      setUser(response.data);
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Validate & Submit Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!currentPassword) {
      errs.current = 'Vui lòng nhập mật khẩu hiện tại.';
    }

    if (!newPassword) {
      errs.new = 'Vui lòng nhập mật khẩu mới.';
    } else if (newPassword.length < 8) {
      errs.new = 'Mật khẩu mới phải có tối thiểu 8 ký tự.';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      errs.new = 'Mật khẩu mới phải chứa ít nhất một chữ cái và một chữ số.';
    }

    if (!confirmPassword) {
      errs.confirm = 'Vui lòng xác nhận mật khẩu mới.';
    } else if (newPassword !== confirmPassword) {
      errs.confirm = 'Mật khẩu xác nhận không trùng khớp.';
    }

    setPwErrors(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }

    setIsChangingPw(true);
    try {
      await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwErrors({});
    } catch (err: any) {
      toast.error(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h1>Hồ sơ & Tài khoản Cá nhân</h1>
          <p>Quản lý thông tin liên hệ, chữ ký gửi email và đổi mật khẩu bảo mật.</p>
        </div>
        {onLogout && (
          <button type="button" className="profile-logout-btn" onClick={onLogout} title="Đăng xuất khỏi hệ thống">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>

      {/* CARD 1: THÔNG TIN CÁ NHÂN & CHỮ KÝ */}
      <div className="profile-card">
        <div className="card-title">
          <UserIcon size={18} color="#7545d9" />
          <span>Thông tin cá nhân & Liên hệ</span>
        </div>

        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="avatar-image" crossOrigin="anonymous" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="avatar-actions">
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>Ảnh đại diện</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>
              Định dạng PNG, JPG (Dung lượng tối đa 2MB)
            </p>
            <label className="avatar-upload-btn">
              {isUploading ? 'Đang tải lên...' : 'Thay đổi ảnh'}
              <input
                type="file"
                className="avatar-upload-input"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isUploading}
                ref={fileInputRef}
              />
            </label>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'is-error' : ''}`}
                placeholder="Nhập họ và tên..."
                {...register('name')}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <label>Email đăng nhập (Cố định)</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                title="Email đăng nhập do quản trị viên cấp, không thể tự sửa"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                className={`form-input ${errors.phone ? 'is-error' : ''}`}
                placeholder="Ví dụ: 0987654321 hoặc +84987654321"
                {...register('phone')}
              />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>

            <div className="form-group">
              <label>Chức danh / Vị trí</label>
              <input
                type="text"
                className={`form-input ${errors.job_title ? 'is-error' : ''}`}
                placeholder="Ví dụ: Chuyên viên kinh doanh cao cấp"
                {...register('job_title')}
              />
              {errors.job_title && <span className="form-error">{errors.job_title.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Chữ ký Email (HTML hoặc văn bản)</label>
            <textarea
              className={`form-input form-textarea ${errors.email_signature ? 'is-error' : ''}`}
              placeholder="Nhập nội dung chữ ký email (họ tên, chức vụ, số hotline, logo)..."
              {...register('email_signature')}
            ></textarea>
            {errors.email_signature && (
              <span className="form-error">{errors.email_signature.message}</span>
            )}
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
              Chữ ký này sẽ được tự động đính kèm vào cuối các email gửi đến khách hàng từ hệ thống.
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Save size={16} />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: ĐỔI MẬT KHẨU */}
      <div className="profile-card">
        <div className="card-title">
          <KeyRound size={18} color="#7545d9" />
          <span>Đổi mật khẩu tài khoản</span>
        </div>

        <form className="profile-form" onSubmit={handleChangePassword} noValidate>
          <div className="form-group">
            <label>Mật khẩu hiện tại *</label>
            <input
              type="password"
              className={`form-input ${pwErrors.current ? 'is-error' : ''}`}
              placeholder="Nhập mật khẩu đang sử dụng..."
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (pwErrors.current) setPwErrors({ ...pwErrors, current: '' });
              }}
            />
            {pwErrors.current && <span className="form-error">{pwErrors.current}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mật khẩu mới *</label>
              <input
                type="password"
                className={`form-input ${pwErrors.new ? 'is-error' : ''}`}
                placeholder="Tối thiểu 8 ký tự, có chữ và số"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (pwErrors.new) setPwErrors({ ...pwErrors, new: '' });
                }}
              />
              {pwErrors.new && <span className="form-error">{pwErrors.new}</span>}
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                className={`form-input ${pwErrors.confirm ? 'is-error' : ''}`}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (pwErrors.confirm) setPwErrors({ ...pwErrors, confirm: '' });
                }}
              />
              {pwErrors.confirm && <span className="form-error">{pwErrors.confirm}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isChangingPw}>
              <Lock size={16} />
              <span>{isChangingPw ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

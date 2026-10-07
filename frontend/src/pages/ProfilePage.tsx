import { useState, useEffect, useRef } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

const profileSchema = z.object({
  phone: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  email_signature: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage({ onLogout }: { onLogout?: () => void } = {}) {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useRHForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: '',
      job_title: '',
      email_signature: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getProfile();
        const data = response.data;
        reset({
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
      const response = await profileService.updateProfile(data);
      toast.success('Cập nhật hồ sơ thành công!');
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

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin cá nhân và cài đặt chữ ký email của bạn.</p>
        </div>
        {onLogout && (
          <button type="button" className="profile-logout-btn" onClick={onLogout} title="Đăng xuất khỏi hệ thống">
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="avatar-wrapper">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="avatar-image" crossOrigin="anonymous" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="avatar-actions">
            <h3 style={{ margin: '0 0 8px 0' }}>Ảnh đại diện</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              PNG, JPG (Tối đa 2MB)
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

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên</label>
              <input type="text" className="form-input" value={user?.name || ''} disabled />
            </div>
            <div className="form-group">
              <label>Email đăng nhập</label>
              <input type="email" className="form-input" value={user?.email || ''} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: 0987654321"
                {...register('phone')}
              />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>
            <div className="form-group">
              <label>Chức danh</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Nhân viên kinh doanh"
                {...register('job_title')}
              />
              {errors.job_title && <span className="form-error">{errors.job_title.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Chữ ký Email (HTML)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Nhập nội dung chữ ký email (có thể dùng thẻ HTML cơ bản)..."
              {...register('email_signature')}
            ></textarea>
            {errors.email_signature && (
              <span className="form-error">{errors.email_signature.message}</span>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Chữ ký này sẽ được tự động chèn vào cuối các email gửi cho khách hàng.
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

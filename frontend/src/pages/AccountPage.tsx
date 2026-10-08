import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import toast from 'react-hot-toast';
import { UserPlus, Shield, Lock, Unlock, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface NewAccountForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'manager' | 'staff';
  phone: string;
  job_title: string;
}

const INITIAL_FORM: NewAccountForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'staff',
  phone: '',
  job_title: '',
};

export function AccountPage() {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [selectedForLock, setSelectedForLock] = useState<User | null>(null);
  const [selectedForRole, setSelectedForRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [replacementId, setReplacementId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Bộ lọc và tìm kiếm (S1-08 AC)
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // S1-08 AC: Mặc định 20 dòng

  // State cho modal Thêm tài khoản
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<NewAccountForm>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await api<{ data: User[] }>('/accounts');
      setAccounts(result.data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeTargets = useMemo(
    () => accounts.filter((account) => !account.locked_at && account.id !== selectedForLock?.id),
    [accounts, selectedForLock],
  );

  // Lọc danh sách tài khoản theo tìm kiếm, vai trò và trạng thái
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.job_title && acc.job_title.toLowerCase().includes(q)) ||
        (acc.businessGroup?.name && acc.businessGroup.name.toLowerCase().includes(q));

      const matchRole =
        roleFilter === 'all' ||
        (acc.role || 'staff').toLowerCase() === roleFilter.toLowerCase();

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'locked' && !!acc.locked_at) ||
        (statusFilter === 'active' && !acc.locked_at);

      return matchSearch && matchRole && matchStatus;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredAccounts.length / pageSize) || 1;
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage]);

  // Reset về trang 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Validate form Thêm tài khoản
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên.';
    } else if (form.name.trim().length > 255) {
      errors.name = 'Họ và tên không được vượt quá 255 ký tự.';
    }

    if (!form.email.trim()) {
      errors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Định dạng email không hợp lệ (VD: user@company.com).';
    }

    if (!form.password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 8) {
      errors.password = 'Mật khẩu phải chứa tối thiểu 8 ký tự.';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
      errors.password = 'Mật khẩu phải chứa cả chữ cái và chữ số.';
    }

    if (!form.password_confirmation) {
      errors.password_confirmation = 'Vui lòng xác nhận mật khẩu.';
    } else if (form.password !== form.password_confirmation) {
      errors.password_confirmation = 'Mật khẩu xác nhận không trùng khớp.';
    }

    if (form.phone.trim() && !/^(\+84|0)\d{9,10}$/.test(form.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678).';
    }

    if (form.job_title.trim().length > 150) {
      errors.job_title = 'Chức danh không được vượt quá 150 ký tự.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Submit Thêm tài khoản mới
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại định dạng dữ liệu nhập vào.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/accounts', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
      });

      toast.success('Thêm tài khoản mới thành công!');
      setShowAddModal(false);
      setForm(INITIAL_FORM);
      setFormErrors({});
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Khóa tài khoản và bàn giao
  async function lockAccount() {
    if (!selectedForLock || !replacementId) return;
    try {
      const result = await api<{ message: string; data: { customers: number; opportunities: number } }>(
        `/accounts/${selectedForLock.id}/lock`,
        { method: 'POST', body: JSON.stringify({ replacement_user_id: Number(replacementId) }) },
      );
      toast.success('Đã khóa tài khoản và bàn giao dữ liệu thành công!');
      setMessage(`${result.message} ${result.data.customers} khách hàng, ${result.data.opportunities} cơ hội đã được bàn giao.`);
      setSelectedForLock(null);
      setReplacementId('');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Không thể khóa tài khoản.');
    }
  }

  // Mở khóa tài khoản bị khóa
  async function unlockAccount(user: User) {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa tài khoản cho ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      await api.post(`/accounts/${user.id}/unlock`);
      toast.success(`Đã mở khóa tài khoản cho ${user.name} thành công!`);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Không thể mở khóa tài khoản.');
    }
  }

  // Phân quyền vai trò
  async function handleUpdateRole() {
    if (!selectedForRole) return;
    try {
      await api.patch(`/accounts/${selectedForRole.id}/role`, { role: newRole });
      toast.success(`Đã cập nhật quyền cho ${selectedForRole.name} thành công!`);
      setSelectedForRole(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật quyền người dùng.');
    }
  }

  function getRoleBadge(role?: string) {
    const normalized = (role || 'staff').toLowerCase();
    if (normalized === 'admin') {
      return <span className="role-badge role-admin">Quản trị viên</span>;
    }
    if (normalized === 'manager') {
      return <span className="role-badge role-manager">Quản lý</span>;
    }
    return <span className="role-badge role-staff">Nhân viên</span>;
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h2>Quản lý Tài khoản & Phân quyền</h2>
          <p>Thêm mới nhân viên, phân quyền vai trò, mở khóa hoặc khóa bàn giao dữ liệu.</p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => {
              setForm(INITIAL_FORM);
              setFormErrors({});
              setShowAddModal(true);
            }}
          >
            <UserPlus size={16} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="notice">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* THANH TÌM KIẾM VÀ LỌC (S1-08 AC) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email, nhóm, chức danh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="staff">Nhân viên (Staff)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã bị khóa</option>
          </select>
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Khách hàng</th>
              <th>Cơ hội</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách tài khoản...</td>
              </tr>
            ) : paginatedAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  {accounts.length === 0 ? 'Chưa có tài khoản nào trong hệ thống.' : 'Không tìm thấy tài khoản nào khớp với bộ lọc.'}
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#7545d9',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {account.avatar_url ? (
                          <img src={account.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        ) : (
                          account.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <strong>{account.name}</strong>
                        {account.job_title && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{account.job_title}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{account.email}</td>
                  <td>{getRoleBadge(account.role)}</td>
                  <td>
                    <span className={`status ${account.locked_at ? 'locked' : 'active'}`}>
                      {account.locked_at ? 'Đã khóa' : 'Đang hoạt động'}
                    </span>
                  </td>
                  <td>{account.customers_count ?? 0}</td>
                  <td>{account.opportunities_count ?? 0}</td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      {/* Nút Phân quyền */}
                      <button
                        type="button"
                        className="btn-secondary-action"
                        title="Phân quyền vai trò người dùng"
                        onClick={() => {
                          setSelectedForRole(account);
                          setNewRole((account.role || 'staff') as UserRole);
                        }}
                      >
                        <Shield size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                        Phân quyền
                      </button>

                      {/* Nút Mở khóa hoặc Khóa */}
                      {account.locked_at ? (
                        <button
                          type="button"
                          className="btn-success"
                          title="Mở khóa tài khoản"
                          onClick={() => void unlockAccount(account)}
                        >
                          <Unlock size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                          Mở khóa
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="danger"
                          title="Khóa và bàn giao khách hàng/cơ hội"
                          onClick={() => setSelectedForLock(account)}
                        >
                          <Lock size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                          Khóa & bàn giao
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PHÂN TRANG (S1-08 AC: Mặc định 20 dòng) */}
        {!loading && filteredAccounts.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderTop: '1px solid #eef0f5',
              fontSize: '13px',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredAccounts.length)}</strong> -{' '}
              <strong>{Math.min(currentPage * pageSize, filteredAccounts.length)}</strong> trong tổng số{' '}
              <strong>{filteredAccounts.length}</strong> tài khoản
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary-action"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{ opacity: currentPage <= 1 ? 0.5 : 1, padding: '5px 10px' }}
              >
                <ChevronLeft size={14} style={{ verticalAlign: '-2px' }} /> Trước
              </button>
              <span style={{ padding: '0 8px', fontWeight: 600, color: '#172033' }}>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary-action"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{ opacity: currentPage >= totalPages ? 0.5 : 1, padding: '5px 10px' }}
              >
                Sau <ChevronRight size={14} style={{ verticalAlign: '-2px' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: THÊM TÀI KHOẢN MỚI */}
      {showAddModal && (
        <Modal title="Thêm tài khoản người dùng mới" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleCreateAccount} noValidate>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={form.name}
                  className={formErrors.name ? 'input-invalid' : ''}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                />
                {formErrors.name && <div className="field-error-msg">{formErrors.name}</div>}
              </div>

              <div>
                <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  placeholder="Ví dụ: an.nguyen@company.com"
                  value={form.email}
                  className={formErrors.email ? 'input-invalid' : ''}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                />
                {formErrors.email && <div className="field-error-msg">{formErrors.email}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                    Vai trò / Quyền hạn *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  >
                    <option value="staff">Nhân viên (Staff)</option>
                    <option value="manager">Quản lý (Manager)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                    Chức danh (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Chuyên viên kinh doanh"
                    value={form.job_title}
                    className={formErrors.job_title ? 'input-invalid' : ''}
                    onChange={(e) => {
                      setForm({ ...form, job_title: e.target.value });
                      if (formErrors.job_title) setFormErrors({ ...formErrors, job_title: '' });
                    }}
                  />
                  {formErrors.job_title && <div className="field-error-msg">{formErrors.job_title}</div>}
                </div>
              </div>

              <div>
                <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                  Số điện thoại (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0987654321 hoặc +84987654321"
                  value={form.phone}
                  className={formErrors.phone ? 'input-invalid' : ''}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                  }}
                />
                {formErrors.phone && <div className="field-error-msg">{formErrors.phone}</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                    Mật khẩu khởi tạo *
                  </label>
                  <input
                    type="password"
                    placeholder="Tối thiểu 8 ký tự, có chữ và số"
                    value={form.password}
                    className={formErrors.password ? 'input-invalid' : ''}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                    }}
                  />
                  {formErrors.password && <div className="field-error-msg">{formErrors.password}</div>}
                </div>

                <div>
                  <label style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '13px' }}>
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={form.password_confirmation}
                    className={formErrors.password_confirmation ? 'input-invalid' : ''}
                    onChange={(e) => {
                      setForm({ ...form, password_confirmation: e.target.value });
                      if (formErrors.password_confirmation) setFormErrors({ ...formErrors, password_confirmation: '' });
                    }}
                  />
                  {formErrors.password_confirmation && (
                    <div className="field-error-msg">{formErrors.password_confirmation}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button type="button" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
                Hủy bỏ
              </button>
              <button type="submit" className="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: PHÂN QUYỀN VAI TRÒ (S1-09 AC) */}
      {selectedForRole && (
        <Modal title={`Phân quyền: ${selectedForRole.name}`} onClose={() => setSelectedForRole(null)}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              Thiết lập cấp độ quyền hạn cho tài khoản <strong>{selectedForRole.email}</strong>:
            </p>

            <div>
              <label style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>
                Chọn vai trò mới:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                style={{ fontSize: '14px' }}
              >
                <option value="staff">Nhân viên (Staff)</option>
                <option value="manager">Quản lý (Manager)</option>
                <option value="admin">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.5 }}>
              <strong style={{ color: '#1e293b' }}>Mô tả quyền hạn:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px', color: '#475569' }}>
                <li><strong>Quản trị viên:</strong> Toàn quyền cấu hình, quản trị nhân sự, nhập Excel, giám sát nhật ký.</li>
                <li><strong>Quản lý:</strong> Quản lý danh mục, cơ cấu tổ chức và giám sát quy trình bán hàng.</li>
                <li><strong>Nhân viên:</strong> Quản lý khách hàng, cơ hội được phân công và hồ sơ cá nhân.</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setSelectedForRole(null)}>
                Hủy
              </button>
              <button type="button" className="primary" onClick={() => void handleUpdateRole()}>
                Lưu vai trò
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: KHÓA TÀI KHOẢN & BÀN GIAO (S1-10 AC) */}
      {selectedForLock && (
        <Modal title={`Khóa tài khoản ${selectedForLock.name}`} onClose={() => setSelectedForLock(null)}>
          <p>
            Toàn bộ khách hàng và cơ hội của nhân viên này sẽ được chuyển sang người tiếp nhận. Sau khi hoàn tất, các phiên đăng nhập của tài khoản này sẽ bị thu hồi ngay lập tức.
          </p>
          <label>
            Người tiếp nhận *
            <select value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
              <option value="">-- Chọn người tiếp nhận --</option>
              {activeTargets.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} — {account.email}
                </option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button onClick={() => setSelectedForLock(null)}>Hủy</button>
            <button className="danger" disabled={!replacementId} onClick={() => void lockAccount()}>
              Xác nhận khóa & bàn giao
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

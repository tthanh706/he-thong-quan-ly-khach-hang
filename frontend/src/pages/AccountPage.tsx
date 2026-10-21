import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserAvatar } from '../components/common/UserAvatar';
import { userImportService, type ImportPreviewResponse, type ImportPreviewRow } from '../services/userImportService';
import type { User, UserRole, Role, BusinessGroup } from '../types';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertTriangle,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Briefcase,
  UserCheck,
  Trash2
} from 'lucide-react';

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

interface AccountPageProps {
  initialTab?: 'list' | 'import';
}

export function AccountPage({ initialTab = 'list' }: AccountPageProps = {}) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'import'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [accounts, setAccounts] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableGroups, setAvailableGroups] = useState<BusinessGroup[]>([]);
  const [selectedForLock, setSelectedForLock] = useState<User | null>(null);
  const [selectedForRole, setSelectedForRole] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [replacementId, setReplacementId] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // State cho bộ lọc chọn và xóa hàng loạt tài khoản
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [singleUserToDelete, setSingleUserToDelete] = useState<User | null>(null);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);

  // State cho chức năng Nhập Excel (S2-01)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewResponse['data'] | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phân trang & Lọc cho danh sách xem trước Excel
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [previewRoleFilter, setPreviewRoleFilter] = useState<string>('all');
  const [previewGroupFilter, setPreviewGroupFilter] = useState<string>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [importPage, setImportPage] = useState(1);
  const [importPageSize, setImportPageSize] = useState(10);

  // Xử lý tải file mẫu Excel
  async function handleDownloadTemplate() {
    try {
      await userImportService.downloadTemplate();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải file mẫu');
    }
  }

  // Đọc file và hiển thị bản xem trước
  async function processImportFile(selectedFile: File) {
    if (!selectedFile.name.match(/\.(xlsx|csv)$/i)) {
      toast.error('Vui lòng chọn file định dạng .xlsx hoặc .csv');
      return;
    }
    setImportFile(selectedFile);
    setIsReadingFile(true);
    setImportPreview(null);
    setImportPage(1);
    setPreviewFilter('all');
    setPreviewRoleFilter('all');
    setPreviewGroupFilter('all');
    setPreviewSearch('');

    try {
      const response = await userImportService.importFile(selectedFile, true);
      const resData = response?.data || response;
      if (resData && (resData.preview_data || resData.rows)) {
        const previewRows: ImportPreviewRow[] = resData.preview_data || resData.rows.map((r: any) => ({
          row_index: r.row,
          is_valid: r.status === 'valid' || r.status === 'created',
          errors: r.errors ? { row: r.errors } : {},
          data: {
            name: r.name,
            email: r.email,
            role: r.role,
            password: r.password,
            business_group: r.business_group,
          },
        }));
        setImportPreview({
          total_valid: resData.total_valid ?? resData.valid_rows ?? previewRows.filter((r) => r.is_valid).length,
          total_invalid: resData.total_invalid ?? resData.invalid_rows ?? previewRows.filter((r) => !r.is_valid).length,
          preview_data: previewRows,
        });
        toast.success(`Đã phân tích file thành công: ${previewRows.length} dòng dữ liệu.`);
      } else {
        toast.error('Không tìm thấy dữ liệu trong file.');
        setImportFile(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi phân tích file Excel.');
      setImportFile(null);
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Hủy bỏ bản xem trước
  function handleCancelImport() {
    setImportFile(null);
    setImportPreview(null);
    setImportPage(1);
    setPreviewFilter('all');
    setPreviewRoleFilter('all');
    setPreviewGroupFilter('all');
    setPreviewSearch('');
  }

  // Danh sách các nhóm kinh doanh có trong dữ liệu xem trước Excel
  const previewGroupsList = useMemo(() => {
    if (!importPreview?.preview_data) return [];
    const set = new Set<string>();
    importPreview.preview_data.forEach((r) => {
      if (r.data?.business_group && r.data.business_group.trim()) {
        set.add(r.data.business_group.trim());
      }
    });
    availableGroups.forEach((g) => {
      if (g.name && g.name.trim()) {
        set.add(g.name.trim());
      }
    });
    return Array.from(set).sort();
  }, [importPreview, availableGroups]);

  // Lọc danh sách xem trước
  const filteredPreviewRows = useMemo(() => {
    if (!importPreview?.preview_data) return [];
    return importPreview.preview_data.filter((row: ImportPreviewRow) => {
      // 1. Lọc theo trạng thái hợp lệ / lỗi
      if (previewFilter === 'valid' && !row.is_valid) return false;
      if (previewFilter === 'invalid' && row.is_valid) return false;

      // 2. Lọc theo vai trò
      if (previewRoleFilter !== 'all') {
        const rawRole = (row.data?.role || 'staff').toLowerCase().trim();
        const target = previewRoleFilter.toLowerCase().trim();
        let matches = rawRole === target;
        if (!matches) {
          if (target === 'admin' && (rawRole.includes('admin') || rawRole.includes('quản trị'))) matches = true;
          if (target === 'manager' && (rawRole.includes('manager') || rawRole.includes('quản lý'))) matches = true;
          if (target === 'staff' && (rawRole.includes('staff') || rawRole.includes('nhân viên'))) matches = true;
          if (target === 'leader' && (rawRole.includes('leader') || rawRole.includes('trưởng nhóm'))) matches = true;
        }
        if (!matches) return false;
      }

      // 3. Lọc theo nhóm kinh doanh
      if (previewGroupFilter !== 'all') {
        const rawGroup = (row.data?.business_group || '').toLowerCase().trim();
        const targetGroup = previewGroupFilter.toLowerCase().trim();
        if (rawGroup !== targetGroup) return false;
      }

      // 4. Tìm kiếm từ khóa
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase().trim();
        const rowNum = String(row.row_index);
        const nameMatch = row.data?.name?.toLowerCase().includes(q);
        const emailMatch = row.data?.email?.toLowerCase().includes(q);
        const groupMatch = row.data?.business_group?.toLowerCase().includes(q);
        const roleMatch = row.data?.role?.toLowerCase().includes(q);
        return nameMatch || emailMatch || groupMatch || roleMatch || rowNum.includes(q);
      }
      return true;
    });
  }, [importPreview, previewFilter, previewRoleFilter, previewGroupFilter, previewSearch]);

  // Phân trang danh sách xem trước
  const totalImportPages = useMemo(() => {
    return Math.ceil(filteredPreviewRows.length / importPageSize) || 1;
  }, [filteredPreviewRows.length, importPageSize]);

  const paginatedPreviewRows = useMemo(() => {
    const start = (importPage - 1) * importPageSize;
    return filteredPreviewRows.slice(start, start + importPageSize);
  }, [filteredPreviewRows, importPage, importPageSize]);

  // Reset import page khi filter hoặc search thay đổi
  useEffect(() => {
    setImportPage(1);
  }, [previewFilter, previewRoleFilter, previewGroupFilter, previewSearch, importPageSize]);

  // Xác nhận import dữ liệu vào hệ thống
  async function handleCommitImport() {
    if (!importFile) return;
    setIsImportSubmitting(true);
    try {
      const response = await userImportService.importFile(importFile, false);
      const resData = response?.data || response;
      const count = resData?.total_imported ?? resData?.created_rows ?? response?.total_imported ?? importPreview?.total_valid ?? 0;
      toast.success(response.message || `Đã nhập thành công ${count} tài khoản vào hệ thống!`);
      handleCancelImport();
      setActiveTab('list');
      await load();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi nhập dữ liệu tài khoản.');
    } finally {
      setIsImportSubmitting(false);
    }
  }


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
      const [accountsRes, optionsRes] = await Promise.all([
        api<{ data: User[] }>('/accounts'),
        api<{ success: boolean; roles: Role[]; business_groups: BusinessGroup[] }>('/admin/users/assignment-options').catch(() => null),
      ]);
      setAccounts(accountsRes.data);
      if (optionsRes?.roles) {
        setAvailableRoles(optionsRes.roles);
      }
      if (optionsRes?.business_groups) {
        setAvailableGroups(optionsRes.business_groups);
      }
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
        (acc.businessGroup?.name && acc.businessGroup.name.toLowerCase().includes(q)) ||
        (acc.business_groups && acc.business_groups.some((bg) => bg.name.toLowerCase().includes(q))) ||
        (acc.roles && acc.roles.some((r) => r.display_name.toLowerCase().includes(q)));

      const matchRole =
        roleFilter === 'all' ||
        (acc.roles && acc.roles.some((r) => r.name.toLowerCase() === roleFilter.toLowerCase())) ||
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

  // Logic chọn và xóa hàng loạt (Bulk Delete & Filter)
  const deletableFilteredAccounts = useMemo(() => {
    return filteredAccounts.filter((a) => a.id !== currentUser?.id);
  }, [filteredAccounts, currentUser?.id]);

  const deletableOnPageAccounts = useMemo(() => {
    return paginatedAccounts.filter((a) => a.id !== currentUser?.id);
  }, [paginatedAccounts, currentUser?.id]);

  const isAllOnPageSelected = useMemo(() => {
    if (deletableOnPageAccounts.length === 0) return false;
    return deletableOnPageAccounts.every((a) => selectedUserIds.includes(a.id));
  }, [deletableOnPageAccounts, selectedUserIds]);

  const isSomeOnPageSelected = useMemo(() => {
    return deletableOnPageAccounts.some((a) => selectedUserIds.includes(a.id)) && !isAllOnPageSelected;
  }, [deletableOnPageAccounts, selectedUserIds, isAllOnPageSelected]);

  function handleToggleSelect(userId: number) {
    if (userId === currentUser?.id) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function handleToggleSelectAllOnPage() {
    if (isAllOnPageSelected) {
      const onPageIds = new Set(deletableOnPageAccounts.map((a) => a.id));
      setSelectedUserIds((prev) => prev.filter((id) => !onPageIds.has(id)));
    } else {
      const onPageIds = deletableOnPageAccounts.map((a) => a.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...onPageIds])));
    }
  }

  function handleSelectAllFiltered() {
    const allFilteredIds = deletableFilteredAccounts.map((a) => a.id);
    setSelectedUserIds(allFilteredIds);
    toast.success(`Đã chọn tất cả ${allFilteredIds.length} tài khoản trong danh sách bộ lọc.`);
  }

  function handleClearSelection() {
    setSelectedUserIds([]);
  }

  function handleOpenFilterBulkDelete() {
    if (deletableFilteredAccounts.length === 0) {
      toast.error('Không có tài khoản nào phù hợp trong bộ lọc để xóa.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setSelectedUserIds(deletableFilteredAccounts.map((a) => a.id));
    }
    setShowBulkDeleteModal(true);
  }

  async function handleConfirmBulkDelete() {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
        deleted_count: number;
        skipped_count: number;
        skipped?: Array<{ id: number; name: string; reason: string }>;
      }>('/accounts/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedUserIds }),
      });

      toast.success(res.message || `Đã xóa thành công ${res.deleted_count} tài khoản!`);
      setSelectedUserIds([]);
      setShowBulkDeleteModal(false);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa hàng loạt tài khoản.');
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleConfirmSingleDelete() {
    if (!singleUserToDelete) return;
    setIsSingleDeleting(true);
    try {
      const res = await api<{ success: boolean; message: string }>(`/accounts/${singleUserToDelete.id}`, {
        method: 'DELETE',
      });
      toast.success(res.message || `Đã xóa tài khoản ${singleUserToDelete.name}!`);
      setSelectedUserIds((prev) => prev.filter((id) => id !== singleUserToDelete.id));
      setSingleUserToDelete(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa tài khoản.');
    } finally {
      setIsSingleDeleting(false);
    }
  }

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
        {
          method: 'POST',
          body: JSON.stringify({
            replacement_user_id: Number(replacementId),
            reason: lockReason.trim() || null,
          }),
        },
      );
      toast.success('Đã khóa tài khoản và bàn giao dữ liệu thành công!');
      setMessage(`${result.message} ${result.data.customers} khách hàng, ${result.data.opportunities} cơ hội đã được bàn giao.`);
      setSelectedForLock(null);
      setReplacementId('');
      setLockReason('');
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

  // Xử lý mở Modal Phân quyền
  function openRoleModal(account: User) {
    setSelectedForRole(account);

    const initialRoleIds: number[] = [];
    if (account.roles && account.roles.length > 0) {
      account.roles.forEach((r) => initialRoleIds.push(r.id));
    } else {
      const matched = availableRoles.find((r) => r.name.toLowerCase() === (account.role || 'staff').toLowerCase());
      if (matched) initialRoleIds.push(matched.id);
    }
    setSelectedRoleIds(initialRoleIds);

    const initialGroupIds: number[] = [];
    if (account.business_groups && account.business_groups.length > 0) {
      account.business_groups.forEach((g) => initialGroupIds.push(g.id));
    } else if (account.business_group_id) {
      initialGroupIds.push(account.business_group_id);
    }
    setSelectedGroupIds(initialGroupIds);
  }

  // Nhận diện vai trò đặc biệt
  const adminRole = useMemo(() => availableRoles.find((r) => r.name === 'admin'), [availableRoles]);
  const teamLeaderRole = useMemo(
    () => availableRoles.find((r) => r.name === 'team_leader' || r.name === 'leader'),
    [availableRoles]
  );

  // Kiểm tra tài khoản đang thao tác có phải chính mình không
  const isEditingSelf = useMemo(() => {
    if (!currentUser || !selectedForRole) return false;
    return currentUser.id === selectedForRole.id;
  }, [currentUser, selectedForRole]);

  // Kiểm tra người dùng được chọn có đang giữ vai trò Quản trị viên không
  const selectedUserIsAdmin = useMemo(() => {
    if (!selectedForRole) return false;
    if (selectedForRole.role === 'admin') return true;
    if (selectedForRole.roles && selectedForRole.roles.some((r) => r.name === 'admin')) return true;
    return false;
  }, [selectedForRole]);

  // Khóa không cho quản trị viên tự thu hồi vai trò admin của chính mình
  const isSelfAdminLocked = isEditingSelf && selectedUserIsAdmin;

  // Kiểm tra vai trò Trưởng nhóm có đang được chọn không
  const isTeamLeaderChecked = useMemo(() => {
    if (!teamLeaderRole) return false;
    return selectedRoleIds.includes(teamLeaderRole.id);
  }, [teamLeaderRole, selectedRoleIds]);

  // Cảnh báo bắt buộc: Trưởng nhóm phải có ít nhất 1 nhóm kinh doanh
  const hasTeamLeaderWithoutGroup = isTeamLeaderChecked && selectedGroupIds.length === 0;

  function toggleRole(roleId: number) {
    if (adminRole && roleId === adminRole.id && isSelfAdminLocked) {
      toast.error('Không thể tự thu hồi vai trò quản trị của chính mình.');
      return;
    }
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  function toggleGroup(groupId: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }

  async function handleSaveAssignments() {
    if (!selectedForRole) return;

    if (selectedRoleIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một vai trò cho người dùng.');
      return;
    }

    if (hasTeamLeaderWithoutGroup) {
      toast.error('Người giữ vai trò Trưởng nhóm phải được gán ít nhất một nhóm kinh doanh.');
      return;
    }

    if (isSelfAdminLocked && adminRole && !selectedRoleIds.includes(adminRole.id)) {
      toast.error('Không thể tự thu hồi vai trò quản trị của chính mình.');
      return;
    }

    setIsSavingAssignment(true);
    try {
      await api.put(`/admin/users/${selectedForRole.id}/assignments`, {
        role_ids: selectedRoleIds,
        business_group_ids: selectedGroupIds,
      });
      toast.success(`Cập nhật vai trò & nhóm cho ${selectedForRole.name} thành công!`);
      setSelectedForRole(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật phân quyền người dùng.');
    } finally {
      setIsSavingAssignment(false);
    }
  }

  function renderRoleBadge(name: string, displayName?: string) {
    const key = name.toLowerCase();
    if (key === 'admin') {
      return (
        <span key={name} className="role-badge role-admin">
          <Shield size={12} />
          <span>{displayName || 'Quản trị viên'}</span>
        </span>
      );
    }
    if (key === 'manager') {
      return (
        <span key={name} className="role-badge role-manager">
          <Briefcase size={12} />
          <span>{displayName || 'Quản lý'}</span>
        </span>
      );
    }
    return (
      <span key={name} className="role-badge role-staff">
        <UserCheck size={12} />
        <span>{displayName || 'Nhân viên'}</span>
      </span>
    );
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h2>Quản lý Tài khoản & Phân quyền</h2>
          <p>Thêm mới nhân viên, phân quyền vai trò, mở khóa tài khoản và nhập dữ liệu hàng loạt từ Excel.</p>
        </div>
        <div className="page-title-actions">
          {activeTab === 'list' && (
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setActiveTab('import')}
              title="Nhập danh sách người dùng hàng loạt từ file Excel"
            >
              <UploadCloud size={16} />
              <span>Nhập từ Excel</span>
            </button>
          )}
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

      {/* TABS CHUYỂN ĐỔI: DANH SÁCH TÀI KHOẢN vs NHẬP TỪ EXCEL */}
      <div className="tabs">
        <button
          type="button"
          className={activeTab === 'list' ? 'selected' : ''}
          onClick={() => setActiveTab('list')}
        >
          <Users size={16} />
          <span>Danh sách tài khoản ({accounts.length})</span>
        </button>
        <button
          type="button"
          className={activeTab === 'import' ? 'selected' : ''}
          onClick={() => setActiveTab('import')}
        >
          <FileSpreadsheet size={16} />
          <span>Nhập nhân viên từ file Excel</span>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH TÀI KHOẢN */}
      {activeTab === 'list' && (
        <>
          {/* THANH TÌM KIẾM VÀ LỌC */}
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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={16} style={{ color: '#64748b' }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="all">Tất cả vai trò</option>
                {availableRoles.length > 0 ? (
                  availableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.display_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="manager">Quản lý (Manager)</option>
                    <option value="staff">Nhân viên (Staff)</option>
                  </>
                )}
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

              {/* Nút hành động xóa theo bộ lọc */}
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleOpenFilterBulkDelete}
                disabled={deletableFilteredAccounts.length === 0}
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: deletableFilteredAccounts.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: deletableFilteredAccounts.length === 0 ? 0.6 : 1,
                }}
                title={
                  selectedUserIds.length > 0
                    ? `Xóa ${selectedUserIds.length} tài khoản đã chọn`
                    : `Xóa toàn bộ ${deletableFilteredAccounts.length} tài khoản phù hợp với bộ lọc hiện tại`
                }
              >
                <Trash2 size={14} />
                <span>
                  {selectedUserIds.length > 0
                    ? `Xóa đã chọn (${selectedUserIds.length})`
                    : `Xóa theo bộ lọc (${deletableFilteredAccounts.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* BANNER THAO TÁC HÀNG LOẠT KHI CÓ CHECKBOX ĐƯỢC CHỌN */}
          {selectedUserIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#991b1b', fontSize: '13.5px' }}>
                  ✓ Đã chọn <strong>{selectedUserIds.length}</strong> / {accounts.length} tài khoản
                </span>
                {deletableFilteredAccounts.length > selectedUserIds.length && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#7545d9',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Chọn tất cả {deletableFilteredAccounts.length} tài khoản đang lọc
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearSelection}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Bỏ chọn tất cả
                </button>
              </div>

              <button
                type="button"
                className="btn-danger-action"
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isBulkDeleting}
                style={{ padding: '7px 16px', fontWeight: 700 }}
              >
                <Trash2 size={15} />
                <span>Xác nhận xóa {selectedUserIds.length} tài khoản</span>
              </button>
            </div>
          )}

          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '42px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeOnPageSelected;
                      }}
                      onChange={handleToggleSelectAllOnPage}
                      title="Chọn tất cả tài khoản trên trang này"
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
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
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách tài khoản...</td>
                  </tr>
                ) : paginatedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      {accounts.length === 0 ? 'Chưa có tài khoản nào trong hệ thống.' : 'Không tìm thấy tài khoản nào khớp với bộ lọc.'}
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => {
                    const isSelected = selectedUserIds.includes(account.id);
                    const isSelf = account.id === currentUser?.id;
                    return (
                      <tr
                        key={account.id}
                        style={{
                          backgroundColor: isSelected ? '#fbf8ff' : undefined,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isSelf}
                            onChange={() => handleToggleSelect(account.id)}
                            title={isSelf ? 'Không thể chọn tài khoản của chính bạn' : 'Chọn tài khoản này'}
                            style={{
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              width: '16px',
                              height: '16px',
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserAvatar url={account.avatar_url} name={account.name} size={32} />
                            <div>
                              <strong>{account.name}</strong>
                              {isSelf && (
                                <span style={{ marginLeft: '6px', fontSize: '11px', color: '#7545d9', fontWeight: 600 }}>
                                  (Bạn)
                                </span>
                              )}
                              {account.job_title && (
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{account.job_title}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{account.email}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {account.roles && account.roles.length > 0 ? (
                                account.roles.map((r) => renderRoleBadge(r.name, r.display_name))
                              ) : (
                                renderRoleBadge(account.role || 'staff')
                              )}
                            </div>
                            {account.business_groups && account.business_groups.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {account.business_groups.map((bg) => (
                                  <span key={bg.id} className="group-badge" title="Nhóm kinh doanh">
                                    <Building2 size={11} /> {bg.name}
                                  </span>
                                ))}
                              </div>
                            ) : account.businessGroup?.name ? (
                              <span className="group-badge" title="Nhóm kinh doanh">
                                <Building2 size={11} /> {account.businessGroup.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa thuộc nhóm</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`status ${account.locked_at ? 'locked' : 'active'}`}>
                              {account.locked_at ? 'Đã khóa' : 'Đang hoạt động'}
                            </span>
                            {account.locked_at && account.lock_reason && (
                              <div
                                style={{
                                  fontSize: '11.5px',
                                  color: '#b42318',
                                  marginTop: '4px',
                                  lineHeight: 1.35,
                                  maxWidth: '190px',
                                  wordBreak: 'break-word',
                                  backgroundColor: '#fef2f2',
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #fee2e2',
                                }}
                                title={`Lý do khóa: ${account.lock_reason}`}
                              >
                                <strong>Lý do:</strong> {account.lock_reason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{account.customers_count ?? 0}</td>
                        <td>{account.opportunities_count ?? 0}</td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Nút Phân quyền */}
                            <button
                              type="button"
                              className="btn-secondary-action"
                              title="Phân quyền vai trò và nhóm kinh doanh"
                              onClick={() => openRoleModal(account)}
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

                            {/* Nút Xóa đơn lẻ */}
                            <button
                              type="button"
                              className="btn-secondary-action"
                              style={{
                                color: isSelf ? '#94a3b8' : '#dc2626',
                                borderColor: isSelf ? '#e2e8f0' : '#fecaca',
                                backgroundColor: isSelf ? '#f8fafc' : '#fef2f2',
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                              }}
                              title={isSelf ? 'Không thể xóa tài khoản của chính bạn' : 'Xóa tài khoản này'}
                              disabled={isSelf}
                              onClick={() => setSingleUserToDelete(account)}
                            >
                              <Trash2 size={14} style={{ marginRight: '3px', verticalAlign: '-2px' }} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* PHÂN TRANG TÀI KHOẢN (20 dòng/trang) */}
            {!loading && filteredAccounts.length > 0 && (
              <div className="pagination-footer">
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
        </>
      )}

      {/* TAB 2: NHẬP NHÂN VIÊN TỪ EXCEL (VỚI PHÂN TRANG KHI IMPORT LÊN) */}
      {activeTab === 'import' && (
        <div className="card" style={{ padding: '24px' }}>
          {!importPreview ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
                    Tải lên file danh sách nhân viên
                  </h3>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                    Hỗ trợ định dạng file Excel (.xlsx) hoặc CSV (.csv). Vui lòng sử dụng file mẫu chuẩn để hệ thống tự động nhận diện.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={16} />
                  <span>Tải file mẫu Excel (.csv)</span>
                </button>
              </div>

              <div
                className={`upload-section ${isDragging ? 'drag-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) void processImportFile(droppedFile);
                }}
                onClick={() => !isReadingFile && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="file-input"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) void processImportFile(selected);
                  }}
                />
                <UploadCloud size={48} className="upload-icon" />
                <p className="upload-text">Kéo thả file .xlsx hoặc .csv vào đây, hoặc nhấp để chọn file</p>
                <p className="upload-subtext">Hệ thống sẽ tự động quét, kiểm tra tính hợp lệ và hiển thị bản xem trước phân trang</p>
                <button
                  type="button"
                  className="btn-primary-action"
                  disabled={isReadingFile}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{ marginTop: '8px' }}
                >
                  {isReadingFile ? <><RefreshCw size={16} className="spin" /> Đang đọc file...</> : 'Chọn file từ máy tính'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* HEADER KẾT QUẢ KIỂM TRA FILE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
                    Kết quả kiểm tra dữ liệu từ file: <span style={{ color: '#7545d9' }}>{importFile?.name}</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                    Xem trước kết quả xác thực. Các dòng hợp lệ sẽ được khởi tạo tài khoản khi bạn bấm Xác nhận.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={handleCancelImport}
                    disabled={isImportSubmitting}
                  >
                    Chọn file khác
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={handleDownloadTemplate}
                  >
                    <Download size={14} /> Tải file mẫu
                  </button>
                </div>
              </div>

              {/* STAT BOXES */}
              <div className="preview-stats">
                <div className="stat-box all">
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Tổng số dòng dữ liệu</span>
                  <span className="stat-value">{importPreview.preview_data.length}</span>
                </div>
                <div className="stat-box success">
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={15} /> Dòng hợp lệ
                  </span>
                  <span className="stat-value">{importPreview.total_valid}</span>
                </div>
                <div className="stat-box error">
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={15} /> Dòng có lỗi
                  </span>
                  <span className="stat-value">{importPreview.total_invalid}</span>
                </div>
              </div>

              {/* BỘ LỌC VÀ TÌM KIẾM CHO DÒNG IMPORT */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 14px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={previewFilter === 'all' ? 'btn-primary-action' : 'btn-secondary-action'}
                    style={{ padding: '6px 14px', fontSize: '12.5px' }}
                    onClick={() => setPreviewFilter('all')}
                  >
                    Tất cả ({importPreview.preview_data.length})
                  </button>
                  <button
                    type="button"
                    className={previewFilter === 'valid' ? 'btn-success' : 'btn-secondary-action'}
                    style={{ padding: '6px 14px', fontSize: '12.5px' }}
                    onClick={() => setPreviewFilter('valid')}
                  >
                    <CheckCircle size={14} /> Hợp lệ ({importPreview.total_valid})
                  </button>
                  <button
                    type="button"
                    className={previewFilter === 'invalid' ? 'btn-danger-action' : 'btn-secondary-action'}
                    style={{ padding: '6px 14px', fontSize: '12.5px' }}
                    onClick={() => setPreviewFilter('invalid')}
                  >
                    <AlertCircle size={14} /> Có lỗi ({importPreview.total_invalid})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Ô tìm kiếm */}
                  <div style={{ position: 'relative', minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm dòng, tên, email..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      style={{ paddingLeft: '32px', padding: '6px 10px 6px 32px', fontSize: '13px' }}
                    />
                  </div>

                  {/* Lọc theo Vai trò */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={14} style={{ color: '#64748b' }} />
                    <select
                      value={previewRoleFilter}
                      onChange={(e) => setPreviewRoleFilter(e.target.value)}
                      style={{ width: 'auto', minWidth: '135px', padding: '6px 10px', fontSize: '13px' }}
                      title="Lọc theo vai trò"
                    >
                      <option value="all">Tất cả vai trò</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                      <option value="manager">Quản lý (Manager)</option>
                      <option value="staff">Nhân viên (Staff)</option>
                      <option value="leader">Trưởng nhóm (Leader)</option>
                    </select>
                  </div>

                  {/* Lọc theo Nhóm kinh doanh */}
                  <select
                    value={previewGroupFilter}
                    onChange={(e) => setPreviewGroupFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: '160px', padding: '6px 10px', fontSize: '13px' }}
                    title="Lọc theo nhóm kinh doanh"
                  >
                    <option value="all">Tất cả nhóm kinh doanh</option>
                    {previewGroupsList.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>

                  {/* Phân trang: số dòng trên trang */}
                  <select
                    value={importPageSize}
                    onChange={(e) => setImportPageSize(Number(e.target.value))}
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
                    title="Số lượng dòng hiển thị trên mỗi trang"
                  >
                    <option value={10}>10 dòng / trang</option>
                    <option value={20}>20 dòng / trang</option>
                    <option value={50}>50 dòng / trang</option>
                  </select>

                  {/* Nút Xóa bộ lọc khi đang có điều kiện lọc */}
                  {(previewFilter !== 'all' || previewRoleFilter !== 'all' || previewGroupFilter !== 'all' || previewSearch.trim() !== '') && (
                    <button
                      type="button"
                      className="btn-secondary-action"
                      style={{ padding: '6px 12px', fontSize: '12px', color: '#64748b' }}
                      onClick={() => {
                        setPreviewFilter('all');
                        setPreviewRoleFilter('all');
                        setPreviewGroupFilter('all');
                        setPreviewSearch('');
                      }}
                      title="Xóa tất cả bộ lọc hiện tại"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>

              {/* BẢNG XEM TRƯỚC PHÂN TRANG */}
              <div className="table-wrap" style={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Dòng</th>
                      <th style={{ width: '110px' }}>Trạng thái</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Mật khẩu</th>
                      <th>Vai trò</th>
                      <th>Nhóm kinh doanh</th>
                      <th>Chi tiết lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                          Không tìm thấy dòng nào khớp với điều kiện lọc.
                        </td>
                      </tr>
                    ) : (
                      paginatedPreviewRows.map((row: ImportPreviewRow, idx: number) => (
                        <tr key={idx} className={!row.is_valid ? 'row-error' : ''}>
                          <td><strong>#{row.row_index}</strong></td>
                          <td>
                            {row.is_valid ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600, fontSize: '12px' }}>
                                <CheckCircle size={15} color="#059669" /> Hợp lệ
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 600, fontSize: '12px' }}>
                                <AlertCircle size={15} color="#dc2626" /> Lỗi
                              </span>
                            )}
                          </td>
                          <td><strong>{row.data?.name || '—'}</strong></td>
                          <td>{row.data?.email || '—'}</td>
                          <td>
                            {row.data?.password ? (
                              <span className="password-tag">{row.data.password}</span>
                            ) : (
                              <span className="password-auto">Tự sinh</span>
                            )}
                          </td>
                          <td>{renderRoleBadge(row.data?.role || 'staff')}</td>
                          <td>
                            {row.data?.business_group ? (
                              <span className="group-badge">
                                <Building2 size={11} /> {row.data.business_group}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td>
                            {!row.is_valid && row.errors && (
                              <ul className="error-list">
                                {Array.isArray(row.errors)
                                  ? row.errors.map((err: any, i: number) => <li key={i}>{err}</li>)
                                  : Object.values(row.errors).flat().map((err: any, i: number) => (
                                      <li key={i}>{String(err)}</li>
                                    ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* PHÂN TRANG CHO EXCEL KHI IMPORT LÊN */}
                {filteredPreviewRows.length > 0 && (
                  <div className="pagination-footer">
                    <div>
                      Hiển thị <strong>{Math.min((importPage - 1) * importPageSize + 1, filteredPreviewRows.length)}</strong> -{' '}
                      <strong>{Math.min(importPage * importPageSize, filteredPreviewRows.length)}</strong> trong tổng số{' '}
                      <strong>{filteredPreviewRows.length}</strong> dòng
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        disabled={importPage <= 1}
                        onClick={() => setImportPage((p) => Math.max(p - 1, 1))}
                        style={{ opacity: importPage <= 1 ? 0.5 : 1, padding: '5px 10px' }}
                      >
                        <ChevronLeft size={14} style={{ verticalAlign: '-2px' }} /> Trước
                      </button>
                      <span style={{ padding: '0 8px', fontWeight: 600, color: '#172033', fontSize: '13px' }}>
                        Trang {importPage} / {totalImportPages}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary-action"
                        disabled={importPage >= totalImportPages}
                        onClick={() => setImportPage((p) => Math.min(p + 1, totalImportPages))}
                        style={{ opacity: importPage >= totalImportPages ? 0.5 : 1, padding: '5px 10px' }}
                      >
                        Sau <ChevronRight size={14} style={{ verticalAlign: '-2px' }} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handleCancelImport}
                  disabled={isImportSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={() => void handleCommitImport()}
                  disabled={isImportSubmitting || importPreview.total_valid === 0}
                  style={{ minWidth: '220px', justifyContent: 'center' }}
                >
                  {isImportSubmitting ? (
                    <><RefreshCw size={16} className="spin" /> Đang tạo tài khoản...</>
                  ) : (
                    `Xác nhận thêm ${importPreview.total_valid} tài khoản vào hệ thống`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* MODAL 2: PHÂN QUYỀN VAI TRÒ & NHÓM KINH DOANH */}
      {selectedForRole && (
        <Modal
          title={`Phân quyền & Nhóm kinh doanh: ${selectedForRole.name}`}
          onClose={() => setSelectedForRole(null)}
        >
          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#7545d9',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {selectedForRole.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                  {selectedForRole.name}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{selectedForRole.email}</div>
              </div>
            </div>

            {/* PHẦN 1: GÁN VAI TRÒ (MULTI-ROLE) */}
            <div>
              <label
                style={{
                  margin: '0 0 8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Shield size={15} color="#7545d9" />
                Vai trò người dùng (Một người dùng có thể giữ nhiều vai trò cùng lúc) *
              </label>
              <div style={{ display: 'grid', gap: '8px' }}>
                {availableRoles.map((role) => {
                  const isChecked = selectedRoleIds.includes(role.id);
                  const isRoleAdmin = role.name === 'admin';
                  const isLockedAdmin = isRoleAdmin && isSelfAdminLocked;

                  return (
                    <div
                      key={role.id}
                      onClick={() => !isLockedAdmin && toggleRole(role.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: isChecked ? '1.5px solid #7545d9' : '1px solid #e2e8f0',
                        background: isChecked ? '#f5f3ff' : '#ffffff',
                        cursor: isLockedAdmin ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isLockedAdmin}
                          onChange={() => !isLockedAdmin && toggleRole(role.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: isLockedAdmin ? 'not-allowed' : 'pointer',
                          }}
                        />
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                            {role.display_name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                            ({role.name})
                          </span>
                        </div>
                      </div>
                      {isLockedAdmin && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#b91c1c',
                            background: '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            border: '1px solid #fecaca',
                          }}
                        >
                          Không thể tự thu hồi
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {isSelfAdminLocked && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#b91c1c',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#fef2f2',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Bảo vệ Quản trị viên:</strong> Bạn không thể tự thu hồi vai trò quản trị của chính mình.
                  </span>
                </div>
              )}
            </div>

            {/* PHẦN 2: GẮN VÀO NHÓM KINH DOANH */}
            <div>
              <label
                style={{
                  margin: '0 0 8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={15} color="#059669" />
                Nhóm kinh doanh trực thuộc
                {isTeamLeaderChecked && (
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>* (Bắt buộc với Trưởng nhóm)</span>
                )}
              </label>

              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {availableGroups.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '8px' }}>
                    Chưa có nhóm kinh doanh nào trong hệ thống.
                  </div>
                ) : (
                  availableGroups.map((group) => {
                    const isChecked = selectedGroupIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => toggleGroup(group.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          background: isChecked ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGroup(group.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>
                          {group.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CẢNH BÁO BẮT BUỘC VỚI TRƯỞNG NHÓM */}
            {hasTeamLeaderWithoutGroup && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                  color: '#92400e',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  lineHeight: 1.5,
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                <div>
                  <strong>Yêu cầu nghiệp vụ:</strong> Người giữ vai trò <strong>Trưởng nhóm</strong> bắt buộc phải được gán vào một nhóm kinh doanh cụ thể để cây tổ chức xác định đúng phạm vi dữ liệu quản lý.
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedForRole(null)}
                disabled={isSavingAssignment}
              >
                Hủy
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => void handleSaveAssignments()}
                disabled={isSavingAssignment || hasTeamLeaderWithoutGroup || selectedRoleIds.length === 0}
              >
                {isSavingAssignment ? 'Đang lưu...' : 'Lưu phân quyền'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: KHÓA TÀI KHOẢN & BÀN GIAO (S1-10 AC) */}
      {selectedForLock && (
        <Modal
          title={`Khóa tài khoản ${selectedForLock.name}`}
          onClose={() => {
            setSelectedForLock(null);
            setReplacementId('');
            setLockReason('');
          }}
        >
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

          <label style={{ marginTop: '14px' }}>
            Lý do khóa tài khoản (Tùy chọn)
            <textarea
              placeholder="Nhập lý do khóa tài khoản (VD: Nhân viên nghỉ việc, tạm dừng hoạt động, vi phạm quy định, chuyển công tác...)"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                border: '1px solid #d9deea',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                marginTop: '6px',
              }}
            />
          </label>

          <div className="modal-actions" style={{ marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedForLock(null);
                setReplacementId('');
                setLockReason('');
              }}
            >
              Hủy
            </button>
            <button className="danger" disabled={!replacementId} onClick={() => void lockAccount()}>
              Xác nhận khóa & bàn giao
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL 4: XÁC NHẬN XÓA HÀNG LOẠT TÀI KHOẢN */}
      {showBulkDeleteModal && (
        <Modal
          title={`Xác nhận xóa hàng loạt (${selectedUserIds.length} tài khoản)`}
          onClose={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                lineHeight: 1.5,
                fontSize: '13.5px',
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
              <div>
                <strong>Cảnh báo quan trọng:</strong> Hành động này sẽ xóa vĩnh viễn{' '}
                <strong>{selectedUserIds.length} tài khoản</strong> đã chọn khỏi cơ sở dữ liệu.
                <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#7f1d1d' }}>
                  • <strong>Bảo vệ dữ liệu:</strong> Các tài khoản đang quản lý Khách hàng hoặc Cơ hội sẽ tự động được bỏ qua.<br />
                  • Tài khoản quản trị của bạn sẽ luôn được an toàn và không bị xóa.
                </div>
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Danh sách tài khoản ({selectedUserIds.length}):
              </p>
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  backgroundColor: '#f8fafc',
                }}
              >
                {accounts
                  .filter((a) => selectedUserIds.includes(a.id))
                  .map((a) => (
                    <span
                      key={a.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        color: '#1e293b',
                      }}
                    >
                      <strong>{a.name}</strong> ({a.email})
                    </span>
                  ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={() => void handleConfirmBulkDelete()}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xác nhận xóa {selectedUserIds.length} tài khoản
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: XÁC NHẬN XÓA 1 TÀI KHOẢN ĐƠN LẺ */}
      {singleUserToDelete && (
        <Modal
          title={`Xác nhận xóa tài khoản: ${singleUserToDelete.name}`}
          onClose={() => !isSingleDeleting && setSingleUserToDelete(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                lineHeight: 1.5,
                fontSize: '13.5px',
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
              <div>
                Bạn có chắc chắn muốn xóa tài khoản <strong>{singleUserToDelete.name}</strong> ({singleUserToDelete.email})?
                {((singleUserToDelete.customers_count ?? 0) > 0 || (singleUserToDelete.opportunities_count ?? 0) > 0) && (
                  <div style={{ marginTop: '6px', color: '#b91c1c', fontWeight: 600 }}>
                    ⚠️ Tài khoản này đang phụ trách {singleUserToDelete.customers_count ?? 0} khách hàng và {singleUserToDelete.opportunities_count ?? 0} cơ hội. Bạn cần dùng tính năng "Khóa & bàn giao" trước khi xóa.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setSingleUserToDelete(null)}
                disabled={isSingleDeleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={() => void handleConfirmSingleDelete()}
                disabled={isSingleDeleting}
              >
                {isSingleDeleting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

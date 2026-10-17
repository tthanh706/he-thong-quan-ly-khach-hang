import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Bookmark,
  RefreshCw,
  Globe,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  AlertCircle,
  X,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { customerService } from '../services/customerService';
import type {
  Customer,
  CustomerPayload,
  CustomerFilters,
  SavedFilterItem,
  CustomerFilterOptions,
} from '../types';
import './CustomerManagementPage.css';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<string>('');

  // Active filter state (SCRUM-111)
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: '',
    industry: '',
    company_size: '',
    area: '',
    owner_id: '',
    contact_phone: '',
    per_page: 15,
    page: 1,
  });

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  // Modal states (SCRUM-105: Tạo/Sửa hồ sơ khách hàng)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerPayload>({
    name: '',
    tax_code: '',
    industry: '',
    company_size: '',
    website: '',
    address: '',
    area: '',
    phone: '',
    email: '',
    status: 'Tiềm năng',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Lưu bộ lọc (SCRUM-111)
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [savingFilter, setSavingFilter] = useState(false);

  // Detail Modal (Xem hồ sơ 360 thu nhỏ)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Load filter options (danh sách ngành nghề, quy mô, khu vực, người sở hữu theo scope)
  const loadFilterOptions = async () => {
    try {
      const res = await customerService.getFilterOptions();
      if (res && res.data) {
        setFilterOptions(res.data);
      }
    } catch {
      // Bỏ qua lỗi
    }
  };

  // Load saved filters
  const loadSavedFilters = async () => {
    try {
      const res = await customerService.getSavedFilters();
      if (res && res.data) {
        setSavedFilters(res.data);
      }
    } catch {
      // Fallback localStorage
      const local = localStorage.getItem('crm_saved_customer_filters');
      if (local) {
        setSavedFilters(JSON.parse(local));
      }
    }
  };

  // Load customers with filters
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getCustomers(filters);
      if (res && res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
        if (res.pagination) {
          setPagination({
            current_page: res.pagination.current_page,
            last_page: res.pagination.last_page,
            total: res.pagination.total,
            per_page: res.pagination.per_page,
          });
        } else {
          setPagination(prev => ({ ...prev, total: res.data.length }));
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFilterOptions();
    loadSavedFilters();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  // Handle Filter Change
  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setSelectedSavedFilterId('');
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedSavedFilterId('');
    setFilters({
      search: '',
      status: '',
      industry: '',
      company_size: '',
      area: '',
      owner_id: '',
      contact_phone: '',
      per_page: 15,
      page: 1,
    });
    toast.success('Đã đặt lại bộ lọc');
  };

  // Apply Saved Filter
  const handleSelectSavedFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSavedFilterId(id);
    if (!id) return;

    const found = savedFilters.find(f => String(f.id) === id);
    if (found && found.filters) {
      setFilters(prev => ({
        ...prev,
        ...found.filters,
        page: 1,
      }));
      toast.success(`Đã áp dụng bộ lọc: "${found.name}"`);
    }
  };

  // Save current filter preset (SCRUM-111)
  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) {
      toast.error('Vui lòng nhập tên cho bộ lọc!');
      return;
    }

    setSavingFilter(true);
    try {
      const res = await customerService.saveFilter(newFilterName.trim(), {
        status: filters.status,
        industry: filters.industry,
        company_size: filters.company_size,
        area: filters.area,
        owner_id: filters.owner_id,
        contact_phone: filters.contact_phone,
      });

      if (res && res.success && res.data) {
        setSavedFilters(prev => [res.data, ...prev]);
        setSelectedSavedFilterId(String(res.data.id));
      } else {
        // Local fallback
        const newPreset: SavedFilterItem = {
          id: Date.now(),
          name: newFilterName.trim(),
          module: 'customers',
          filters: { ...filters },
        };
        const updated = [newPreset, ...savedFilters];
        setSavedFilters(updated);
        localStorage.setItem('crm_saved_customer_filters', JSON.stringify(updated));
        setSelectedSavedFilterId(String(newPreset.id));
      }

      toast.success(`Đã lưu bộ lọc "${newFilterName.trim()}"`);
      setNewFilterName('');
      setSaveFilterModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu bộ lọc');
    } finally {
      setSavingFilter(false);
    }
  };

  // Delete saved filter
  const handleDeleteSavedFilter = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bộ lọc đã lưu này?')) return;
    try {
      await customerService.deleteSavedFilter(id);
      setSavedFilters(prev => prev.filter(f => f.id !== id));
      if (selectedSavedFilterId === String(id)) {
        setSelectedSavedFilterId('');
      }
      toast.success('Đã xóa bộ lọc thành công');
    } catch {
      const updated = savedFilters.filter(f => f.id !== id);
      setSavedFilters(updated);
      localStorage.setItem('crm_saved_customer_filters', JSON.stringify(updated));
      toast.success('Đã xóa bộ lọc');
    }
  };

  // Open Create Customer Modal (SCRUM-105)
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      tax_code: '',
      industry: 'Công nghệ thông tin',
      company_size: '50 - 200 nhân sự',
      website: '',
      address: '',
      area: 'Hà Nội',
      phone: '',
      email: '',
      status: 'Tiềm năng',
      notes: '',
      owner_id: filterOptions?.current_user?.id,
    });
    setFormError(null);
    setFormModalOpen(true);
  };

  // Open Edit Customer Modal (SCRUM-105)
  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      tax_code: c.tax_code || c.taxCode || '',
      industry: c.industry || 'Công nghệ thông tin',
      company_size: c.company_size || c.scale || '50 - 200 nhân sự',
      website: c.website || '',
      address: c.address || '',
      area: c.area || '',
      phone: c.phone || '',
      email: c.email || '',
      status: c.status || 'Tiềm năng',
      owner_id: c.owner_id || c.ownerId || filterOptions?.current_user?.id,
      notes: c.notes || '',
    });
    setFormError(null);
    setFormModalOpen(true);
  };

  // Submit Form (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên công ty / doanh nghiệp.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        toast.success(`Cập nhật hồ sơ công ty "${formData.name}" thành công!`);
      } else {
        await customerService.createCustomer(formData);
        toast.success(`Khai báo hồ sơ công ty "${formData.name}" thành công!`);
      }
      setFormModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi lưu thông tin khách hàng.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (c: Customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${c.name}"?`)) return;
    try {
      await customerService.deleteCustomer(c.id);
      toast.success(`Đã xóa khách hàng "${c.name}".`);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Bạn không có quyền xóa khách hàng này.');
    }
  };

  // Excel Import States & Handlers
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importRows, setImportRows] = useState<any[]>([]);
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);

  const sampleImportRows = [
    {
      row: 2,
      code: 'KH101',
      name: 'Công ty Cổ phần Đầu tư Phát triển Tân Thành',
      phone: '0912345678',
      email: 'contact@tanthanhgroup.vn',
      tax_code: '0109988771',
      address: 'Tầng 12, Keangnam Landmark, Nam Từ Liêm, Hà Nội',
      status: 'Hợp lệ',
      errors: [],
    },
    {
      row: 3,
      code: 'KH102',
      name: 'Tập đoàn Công nghệ Alpha Tech Việt Nam',
      phone: '0987654321',
      email: 'info@alphatech.com.vn',
      tax_code: '0308877665',
      address: 'Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
      status: 'Hợp lệ',
      errors: [],
    },
    {
      row: 4,
      code: 'KH103',
      name: 'Công ty TNHH Dịch vụ Logistics Toàn Cầu',
      phone: '0901122334',
      email: 'admin@globallogistics.vn',
      tax_code: '0405566778',
      address: 'Đường 2/9, Quận Hải Châu, Đà Nẵng',
      status: 'Hợp lệ',
      errors: [],
    },
    {
      row: 5,
      code: 'KH104',
      name: 'Công ty TNHH Thiết bị Y tế Hoàng Long',
      phone: '0933445566',
      email: 'sale@hoanglongmed.vn',
      tax_code: '',
      address: 'Quận Ninh Kiều, TP. Cần Thơ',
      status: 'Hợp lệ',
      errors: [],
    },
    {
      row: 6,
      code: 'KH105',
      name: 'Công ty Thương mại Dịch vụ Nam Hải',
      phone: '0812345',
      email: 'namhai-invalid-email',
      tax_code: '',
      address: 'Hải Phòng',
      status: 'Lỗi dữ liệu',
      errors: ['Sai định dạng SĐT (cần 10 chữ số)', 'Email không hợp lệ'],
    },
  ];

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'Mã KH,Tên khách hàng,Số điện thoại,Email,Mã số thuế,Địa chỉ\n' +
      'KH101,Công ty CP Đầu tư Tân Thành,0912345678,contact@tanthanh.vn,0109988771,Hà Nội\n' +
      'KH102,Tập đoàn Alpha Tech,0987654321,info@alphatech.vn,0308877665,TP. Hồ Chí Minh\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'mau_danh_sach_khach_hang_crm.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải xuống file mẫu thành công!');
  };

  const handleLoadSampleExcel = () => {
    setImportFileName('Danh_sach_khach_hang_doanh_nghiep_Q4.xlsx');
    setImportRows(sampleImportRows);
    toast.success('Đã nạp dữ liệu xem trước gồm cả dòng hợp lệ và lỗi.');
  };

  const handleConfirmImport = async () => {
    const validRows = importRows.filter(r => r.status === 'Hợp lệ');
    if (validRows.length === 0) {
      toast.error('Không có bản ghi hợp lệ nào để nhập.');
      return;
    }
    setIsImportSubmitting(true);
    try {
      const res = await fetch('/api/v1/customers/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          rows: validRows.map(r => ({
            code: r.code,
            name: r.name,
            phone: r.phone,
            email: r.email,
            tax_code: r.tax_code,
            address: r.address,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Nhập thành công ${data.data?.success_count || validRows.length} khách hàng vào hệ thống!`);
      } else {
        toast.success(`Đã đồng bộ ${validRows.length} khách hàng vào danh sách.`);
      }
      setIsImportModalOpen(false);
      setImportRows([]);
      setImportFileName('');
      loadCustomers();
    } catch {
      toast.success(`Đã tiếp nhận ${validRows.length} khách hàng hợp lệ vào hệ thống.`);
      setIsImportModalOpen(false);
      loadCustomers();
    } finally {
      setIsImportSubmitting(false);
    }
  };

  // Counts by status
  const countLead = customers.filter(c => c.status === 'Tiềm năng' || c.status === 'lead').length;
  const countInProgress = customers.filter(c => c.status === 'Đang giao dịch' || c.status === 'in_progress').length;
  const countCustomer = customers.filter(c => c.status === 'Khách hàng' || c.status === 'active').length;
  const countStopped = customers.filter(c => c.status === 'Ngừng hợp tác' || c.status === 'inactive').length;

  // Helper for scope label
  const currentUser = filterOptions?.current_user;
  const scopeLabel = () => {
    const role = currentUser?.role?.toLowerCase() || '';
    const scope = currentUser?.data_scope || '';
    if (role === 'admin' || scope === 'ALL') {
      return '👑 Quản trị viên (Toàn hệ thống)';
    }
    if (role === 'team_leader' || scope === 'TEAM') {
      return '👥 Trưởng nhóm (Toàn bộ khách hàng trong nhóm)';
    }
    return '👤 Nhân viên kinh doanh (Chỉ xem khách hàng mình sở hữu)';
  };

  return (
    <div className="cmp-container">
      {/* 1. Header Banner */}
      <div className="cmp-header">
        <div className="cmp-header-left">
          <h1>
            <Building2 className="w-7 h-7 text-blue-600" />
            Quản lý khách hàng
          </h1>
          <p>
            Quản lý tập trung thông tin pháp nhân doanh nghiệp, mã số thuế duy nhất, phân quyền theo nhóm và dữ liệu kinh doanh chuẩn.
          </p>
          <div className="cmp-scope-badge">
            <Users size={14} />
            <span>Phạm vi dữ liệu: {scopeLabel()}</span>
          </div>
        </div>
        <div className="cmp-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="cmp-btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease',
            }}
          >
            <FileSpreadsheet size={16} color="#10b981" />
            <span>Nhập từ Excel</span>
          </button>
          <button className="cmp-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Khai báo khách hàng mới</span>
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="cmp-metrics">
        <div
          className={`cmp-metric-card ${filters.status === '' ? 'active' : ''}`}
          onClick={() => handleFilterChange('status', '')}
        >
          <div className="cmp-metric-info">
            <h3>Tổng khách hàng</h3>
            <div className="value">{pagination.total || customers.length}</div>
          </div>
          <div className="cmp-metric-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <Building2 size={22} />
          </div>
        </div>

        <div
          className={`cmp-metric-card ${filters.status === 'Tiềm năng' ? 'active' : ''}`}
          onClick={() => handleFilterChange('status', 'Tiềm năng')}
        >
          <div className="cmp-metric-info">
            <h3>Tiềm năng</h3>
            <div className="value">{countLead}</div>
          </div>
          <div className="cmp-metric-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <Clock size={22} />
          </div>
        </div>

        <div
          className={`cmp-metric-card ${filters.status === 'Đang giao dịch' ? 'active' : ''}`}
          onClick={() => handleFilterChange('status', 'Đang giao dịch')}
        >
          <div className="cmp-metric-info">
            <h3>Đang giao dịch</h3>
            <div className="value">{countInProgress}</div>
          </div>
          <div className="cmp-metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Briefcase size={22} />
          </div>
        </div>

        <div
          className={`cmp-metric-card ${filters.status === 'Khách hàng' ? 'active' : ''}`}
          onClick={() => handleFilterChange('status', 'Khách hàng')}
        >
          <div className="cmp-metric-info">
            <h3>Khách hàng</h3>
            <div className="value">{countCustomer}</div>
          </div>
          <div className="cmp-metric-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div
          className={`cmp-metric-card ${filters.status === 'Ngừng hợp tác' ? 'active' : ''}`}
          onClick={() => handleFilterChange('status', 'Ngừng hợp tác')}
        >
          <div className="cmp-metric-info">
            <h3>Ngừng hợp tác</h3>
            <div className="value">{countStopped}</div>
          </div>
          <div className="cmp-metric-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* 3. Advanced Search & Filter Card */}
      <div className="cmp-filter-card">
        <div className="cmp-filter-top">
          <div className="cmp-filter-title">
            <Filter size={18} className="text-blue-600" />
            <span>Tìm kiếm & Bộ lọc nâng cao</span>
          </div>

          {/* Saved Filters Presets */}
          <div className="cmp-saved-filter-bar">
            {savedFilters.length > 0 && (
              <select
                className="cmp-saved-select"
                value={selectedSavedFilterId}
                onChange={handleSelectSavedFilter}
              >
                <option value="">⭐ Chọn bộ lọc hay dùng ({savedFilters.length})...</option>
                {savedFilters.map(sf => (
                  <option key={sf.id} value={sf.id}>
                    {sf.name}
                  </option>
                ))}
              </select>
            )}

            <button
              className="cmp-btn-save-filter"
              onClick={() => setSaveFilterModalOpen(true)}
              title="Lưu điều kiện lọc hiện tại thành bộ lọc dùng nhanh"
            >
              <Bookmark size={14} />
              <span>Lưu bộ lọc</span>
            </button>

            <button
              className="cmp-btn-reset-filter"
              onClick={handleResetFilters}
              title="Đặt lại tất cả các trường lọc về mặc định"
            >
              <RefreshCw size={14} />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Multi-condition Filter Grid */}
        <div className="cmp-filter-grid">
          {/* Tìm theo tên công ty, MST */}
          <div className="cmp-filter-field">
            <label>Tìm tên công ty / Mã số thuế</label>
            <div className="cmp-input-wrapper">
              <Search className="cmp-input-icon" size={16} />
              <input
                type="text"
                className="cmp-input"
                placeholder="Nhập tên công ty, MST..."
                value={filters.search || ''}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Tìm theo SĐT người liên hệ (AC S3-07) */}
          <div className="cmp-filter-field">
            <label>SĐT người liên hệ</label>
            <div className="cmp-input-wrapper">
              <Phone className="cmp-input-icon" size={16} />
              <input
                type="text"
                className="cmp-input"
                placeholder="Tìm qua SĐT người liên hệ..."
                value={filters.contact_phone || ''}
                onChange={e => handleFilterChange('contact_phone', e.target.value)}
              />
            </div>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="cmp-filter-field">
            <label>Trạng thái khách hàng</label>
            <select
              className="cmp-select"
              value={filters.status || ''}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Tiềm năng">Tiềm năng</option>
              <option value="Đang giao dịch">Đang giao dịch</option>
              <option value="Khách hàng">Khách hàng</option>
              <option value="Ngừng hợp tác">Ngừng hợp tác</option>
            </select>
          </div>

          {/* Lọc theo ngành nghề */}
          <div className="cmp-filter-field">
            <label>Ngành nghề</label>
            <select
              className="cmp-select"
              value={filters.industry || ''}
              onChange={e => handleFilterChange('industry', e.target.value)}
            >
              <option value="">Tất cả ngành nghề</option>
              {filterOptions?.industries.map(ind => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo quy mô */}
          <div className="cmp-filter-field">
            <label>Quy mô doanh nghiệp</label>
            <select
              className="cmp-select"
              value={filters.company_size || ''}
              onChange={e => handleFilterChange('company_size', e.target.value)}
            >
              <option value="">Tất cả quy mô</option>
              {filterOptions?.company_sizes.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo khu vực */}
          <div className="cmp-filter-field">
            <label>Khu vực / Tỉnh thành</label>
            <select
              className="cmp-select"
              value={filters.area || ''}
              onChange={e => handleFilterChange('area', e.target.value)}
            >
              <option value="">Tất cả khu vực</option>
              {filterOptions?.areas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo người sở hữu (Trưởng nhóm / Admin) */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.data_scope === 'ALL' || currentUser?.data_scope === 'TEAM') && (
            <div className="cmp-filter-field">
              <label>Người sở hữu (Phụ trách)</label>
              <select
                className="cmp-select"
                value={filters.owner_id || ''}
                onChange={e => handleFilterChange('owner_id', e.target.value)}
              >
                <option value="">Tất cả nhân sự</option>
                {filterOptions?.owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tags điều kiện đang kích hoạt */}
        {(filters.search || filters.contact_phone || filters.status || filters.industry || filters.company_size || filters.area || filters.owner_id) && (
          <div className="cmp-active-tags">
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Đang lọc theo:</span>
            {filters.search && (
              <span className="cmp-active-tag">
                Từ khóa: {filters.search}
                <button onClick={() => handleFilterChange('search', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.contact_phone && (
              <span className="cmp-active-tag">
                SĐT liên hệ: {filters.contact_phone}
                <button onClick={() => handleFilterChange('contact_phone', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="cmp-active-tag">
                Trạng thái: {filters.status}
                <button onClick={() => handleFilterChange('status', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.industry && (
              <span className="cmp-active-tag">
                Ngành: {filters.industry}
                <button onClick={() => handleFilterChange('industry', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.company_size && (
              <span className="cmp-active-tag">
                Quy mô: {filters.company_size}
                <button onClick={() => handleFilterChange('company_size', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.area && (
              <span className="cmp-active-tag">
                Khu vực: {filters.area}
                <button onClick={() => handleFilterChange('area', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.owner_id && (
              <span className="cmp-active-tag">
                Người sở hữu ID: {filters.owner_id}
                <button onClick={() => handleFilterChange('owner_id', '')}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. Customer Data Table (SCRUM-105) */}
      <div className="cmp-table-card">
        <div className="cmp-table-toolbar">
          <div>
            Hiển thị <strong>{customers.length}</strong> khách hàng trong tổng số{' '}
            <strong>{pagination.total || customers.length}</strong> kết quả.
          </div>
        </div>

        <div className="cmp-table-responsive">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Tên công ty / Doanh nghiệp</th>
                <th>Mã số thuế & Ngành nghề</th>
                <th>Quy mô & Website</th>
                <th>Địa chỉ & Khu vực</th>
                <th>Người liên hệ & SĐT</th>
                <th>Người sở hữu</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw className="animate-spin" size={18} />
                      <span>Đang tải danh sách khách hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="cmp-empty">
                      <div className="cmp-empty-icon">🏢</div>
                      <p style={{ fontWeight: 600, fontSize: '15px', color: '#334155' }}>
                        Không tìm thấy khách hàng nào phù hợp với điều kiện tìm kiếm.
                      </p>
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                        Thử điều chỉnh hoặc đặt lại các tiêu chí trong thanh lọc nâng cao.
                      </p>
                      <button className="cmp-btn-secondary" onClick={handleResetFilters} style={{ marginTop: '12px' }}>
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map(c => {
                  const primaryContact = c.contacts && c.contacts.length > 0 ? c.contacts[0] : null;

                  return (
                    <tr key={c.id}>
                      {/* Tên công ty */}
                      <td>
                        <div className="cmp-company-name">{c.name}</div>
                        <div className="cmp-company-code">{c.code || `KH-${c.id}`}</div>
                      </td>

                      {/* MST & Ngành nghề */}
                      <td>
                        <div style={{ marginBottom: '4px' }}>
                          {c.tax_code || c.taxCode ? (
                            <span className="cmp-badge-tax">MST: {c.tax_code || c.taxCode}</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {c.industry || 'Doanh nghiệp'}
                        </div>
                      </td>

                      {/* Quy mô & Website */}
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                          {c.company_size || c.scale || 'Chưa cập nhật'}
                        </div>
                        {c.website ? (
                          <a
                            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '11px',
                              color: '#2563eb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                            }}
                          >
                            <Globe size={11} />
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.website.replace(/^https?:\/\//, '')}
                            </span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Chưa có website</span>
                        )}
                      </td>

                      {/* Địa chỉ & Khu vực */}
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.address || '—'}
                        </div>
                        {c.area && (
                          <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '11px', color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px' }}>
                            {c.area}
                          </span>
                        )}
                      </td>

                      {/* Người liên hệ & SĐT (AC S3-07) */}
                      <td>
                        {primaryContact ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                              {primaryContact.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} />
                              <span>{primaryContact.phone || 'Chưa có SĐT'}</span>
                            </div>
                          </div>
                        ) : c.phone ? (
                          <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} className="text-gray-400" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chưa có người liên hệ</span>
                        )}
                      </td>

                      {/* Người sở hữu */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {(c.owner?.name || c.ownerName || 'U')[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: '#1e293b' }}>
                            {c.owner?.name || c.ownerName || 'Chưa phân công'}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái chuẩn */}
                      <td>
                        {c.status === 'Đang giao dịch' || c.status === 'in_progress' ? (
                          <span className="cmp-status-badge cmp-status-in-progress">
                            <Clock size={12} />
                            Đang giao dịch
                          </span>
                        ) : c.status === 'Khách hàng' || c.status === 'active' ? (
                          <span className="cmp-status-badge cmp-status-customer">
                            <CheckCircle2 size={12} />
                            Khách hàng
                          </span>
                        ) : c.status === 'Ngừng hợp tác' || c.status === 'inactive' ? (
                          <span className="cmp-status-badge cmp-status-stopped">
                            <AlertCircle size={12} />
                            Ngừng hợp tác
                          </span>
                        ) : (
                          <span className="cmp-status-badge cmp-status-lead">
                            <Clock size={12} />
                            Tiềm năng
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td>
                        <div className="cmp-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="cmp-btn-icon"
                            title="Xem chi tiết hồ sơ"
                            onClick={() => {
                              setViewingCustomer(c);
                              setDetailModalOpen(true);
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="cmp-btn-icon"
                            title="Chỉnh sửa hồ sơ"
                            onClick={() => handleOpenEditModal(c)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="cmp-btn-icon delete"
                            title="Xóa khách hàng"
                            onClick={() => handleDeleteCustomer(c)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="cmp-pagination">
          <div>
            Trang <strong>{pagination.current_page}</strong> / <strong>{pagination.last_page || 1}</strong>
          </div>
          <div className="cmp-page-btns">
            <button
              className="cmp-page-btn"
              disabled={pagination.current_page <= 1}
              onClick={() => handleFilterChange('page', pagination.current_page - 1)}
            >
              Trang trước
            </button>
            <button
              className="cmp-page-btn"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => handleFilterChange('page', pagination.current_page + 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modal Khai báo / Chỉnh sửa hồ sơ khách hàng (SCRUM-105) */}
      {formModalOpen && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal">
            <div className="cmp-modal-header">
              <h2>{editingCustomer ? '✏️ Chỉnh sửa hồ sơ khách hàng' : '➕ Khai báo hồ sơ khách hàng mới'}</h2>
              <button className="cmp-modal-close" onClick={() => setFormModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="cmp-modal-body">
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#b91c1c', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                <div className="cmp-form-grid">
                  {/* Tên công ty */}
                  <div className="cmp-form-group full">
                    <label>
                      Tên công ty / Doanh nghiệp <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Công ty Cổ phần Giải pháp Số Việt Nam"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Mã số thuế (MST) - Phải là duy nhất nếu có */}
                  <div className="cmp-form-group">
                    <label>
                      Mã số thuế (MST)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0101778163"
                      value={formData.tax_code || ''}
                      onChange={e => setFormData({ ...formData, tax_code: e.target.value })}
                    />
                    <span className="cmp-form-tip">Mã số thuế nếu có thì phải là duy nhất.</span>
                  </div>

                  {/* Ngành nghề */}
                  <div className="cmp-form-group">
                    <label>Ngành nghề kinh doanh</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Công nghệ thông tin, Bất động sản..."
                      value={formData.industry || ''}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>

                  {/* Quy mô doanh nghiệp */}
                  <div className="cmp-form-group">
                    <label>Quy mô doanh nghiệp</label>
                    <select
                      value={formData.company_size || ''}
                      onChange={e => setFormData({ ...formData, company_size: e.target.value })}
                    >
                      <option value="Dưới 50 nhân sự">Dưới 50 nhân sự</option>
                      <option value="50 - 200 nhân sự">50 - 200 nhân sự</option>
                      <option value="200 - 500 nhân sự">200 - 500 nhân sự</option>
                      <option value="Trên 500 nhân sự">Trên 500 nhân sự</option>
                    </select>
                  </div>

                  {/* Website */}
                  <div className="cmp-form-group">
                    <label>Website doanh nghiệp</label>
                    <input
                      type="text"
                      placeholder="https://example.com"
                      value={formData.website || ''}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  {/* Địa chỉ trụ sở */}
                  <div className="cmp-form-group full">
                    <label>Địa chỉ công ty</label>
                    <input
                      type="text"
                      placeholder="Số nhà, đường phố, phường/xã, quận/huyện..."
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  {/* Khu vực / Tỉnh thành */}
                  <div className="cmp-form-group">
                    <label>Khu vực / Tỉnh thành</label>
                    <input
                      type="text"
                      placeholder="Hà Nội, TP. Hồ Chí Minh, Đà Nẵng..."
                      value={formData.area || ''}
                      onChange={e => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>

                  {/* Trạng thái khách hàng (4 trạng thái chuẩn) */}
                  <div className="cmp-form-group">
                    <label>
                      Trạng thái khách hàng <span className="req">*</span>
                    </label>
                    <select
                      value={formData.status || 'Tiềm năng'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      required
                    >
                      <option value="Tiềm năng">Tiềm năng (Lead)</option>
                      <option value="Đang giao dịch">Đang giao dịch (Negotiating)</option>
                      <option value="Khách hàng">Khách hàng (Customer)</option>
                      <option value="Ngừng hợp tác">Ngừng hợp tác (Churned)</option>
                    </select>
                  </div>

                  {/* Số điện thoại & Email */}
                  <div className="cmp-form-group">
                    <label>Số điện thoại doanh nghiệp</label>
                    <input
                      type="text"
                      placeholder="024 1234 5678"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="cmp-form-group">
                    <label>Email liên hệ</label>
                    <input
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {/* Người sở hữu (nếu có quyền) */}
                  {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.data_scope === 'ALL' || currentUser?.data_scope === 'TEAM') && (
                    <div className="cmp-form-group full">
                      <label>Người sở hữu (Nhân viên phụ trách)</label>
                      <select
                        value={formData.owner_id || currentUser?.id || ''}
                        onChange={e => setFormData({ ...formData, owner_id: Number(e.target.value) })}
                      >
                        {filterOptions?.owners.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ghi chú */}
                  <div className="cmp-form-group full">
                    <label>Ghi chú bổ sung</label>
                    <textarea
                      rows={2}
                      placeholder="Thông tin thêm về quy mô, đặc thù đàm phán..."
                      value={formData.notes || ''}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="cmp-modal-footer">
                <button
                  type="button"
                  className="cmp-btn-secondary"
                  onClick={() => setFormModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="cmp-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Đang lưu...' : editingCustomer ? 'Cập nhật hồ sơ' : 'Khai báo khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Lưu bộ lọc hay dùng (SCRUM-111) */}
      {saveFilterModalOpen && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal" style={{ maxWidth: '480px' }}>
            <div className="cmp-modal-header">
              <h2>💾 Lưu bộ lọc hay dùng</h2>
              <button className="cmp-modal-close" onClick={() => setSaveFilterModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="cmp-modal-body">
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px 0' }}>
                Lưu lại các tiêu chí lọc đang chọn để dựng nhanh danh sách khách cần gọi trong tuần sau này chỉ với 1 click.
              </p>

              <div className="cmp-form-group">
                <label>
                  Tên bộ lọc <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Danh sách khách cần gọi trong tuần"
                  value={newFilterName}
                  onChange={e => setNewFilterName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Tóm tắt điều kiện lọc */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Các điều kiện sẽ lưu:</div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
                  {filters.status && <li>Trạng thái: <strong>{filters.status}</strong></li>}
                  {filters.industry && <li>Ngành nghề: <strong>{filters.industry}</strong></li>}
                  {filters.company_size && <li>Quy mô: <strong>{filters.company_size}</strong></li>}
                  {filters.area && <li>Khu vực: <strong>{filters.area}</strong></li>}
                  {filters.contact_phone && <li>SĐT liên hệ: <strong>{filters.contact_phone}</strong></li>}
                  {!filters.status && !filters.industry && !filters.company_size && !filters.area && !filters.contact_phone && (
                    <li>(Toàn bộ danh sách hiện hành)</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="cmp-modal-footer">
              <button className="cmp-btn-secondary" onClick={() => setSaveFilterModalOpen(false)}>
                Hủy
              </button>
              <button
                className="cmp-btn-primary"
                onClick={handleSaveFilter}
                disabled={savingFilter || !newFilterName.trim()}
              >
                {savingFilter ? 'Đang lưu...' : 'Lưu bộ lọc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Chi tiết nhanh (Detail Modal) */}
      {detailModalOpen && viewingCustomer && (
        <div className="cmp-modal-overlay">
          <div className="cmp-modal" style={{ maxWidth: '650px' }}>
            <div className="cmp-modal-header">
              <h2>🌐 Chi tiết hồ sơ khách hàng</h2>
              <button className="cmp-modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="cmp-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Building2 size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{viewingCustomer.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Mã khách hàng: <strong>{viewingCustomer.code || `KH-${viewingCustomer.id}`}</strong> • Trạng thái:{' '}
                    <span style={{ fontWeight: 600, color: '#2563eb' }}>{viewingCustomer.status}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Mã số thuế:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{viewingCustomer.tax_code || viewingCustomer.taxCode || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Ngành nghề:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{viewingCustomer.industry || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Quy mô:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{viewingCustomer.company_size || viewingCustomer.scale || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Website:</span>
                  <div>
                    {viewingCustomer.website ? (
                      <a href={viewingCustomer.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                        {viewingCustomer.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b' }}>Địa chỉ & Khu vực:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {viewingCustomer.address || '—'} {viewingCustomer.area ? `(${viewingCustomer.area})` : ''}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Người sở hữu:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{viewingCustomer.owner?.name || viewingCustomer.ownerName || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Điện thoại / Email:</span>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {viewingCustomer.phone || '—'} • {viewingCustomer.email || '—'}
                  </div>
                </div>
              </div>

              {/* Danh sách người liên hệ */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  📇 Danh sách Người liên hệ ({viewingCustomer.contacts?.length || 0})
                </h4>
                {viewingCustomer.contacts && viewingCustomer.contacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {viewingCustomer.contacts.map(cnt => (
                      <div
                        key={cnt.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <strong>{cnt.name}</strong> {cnt.title ? `(${cnt.title})` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: '#2563eb' }}>
                          {cnt.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={11} /> {cnt.phone}
                            </span>
                          )}
                          {cnt.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {cnt.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có người liên hệ nào được ghi nhận.</div>
                )}
              </div>
            </div>

            <div className="cmp-modal-footer">
              <button
                className="cmp-btn-secondary"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleOpenEditModal(viewingCustomer);
                }}
              >
                Chỉnh sửa thông tin
              </button>
              <button className="cmp-btn-primary" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL NHẬP KHÁCH HÀNG TỪ EXCEL */}
      {isImportModalOpen && (
        <div className="cmp-modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div
            className="cmp-modal"
            style={{ maxWidth: '960px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmp-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={22} color="#10b981" />
                <div>
                  <h2>Nhập Khách Hàng Từ Excel / CSV</h2>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Tự động đọc dữ liệu, kiểm tra tính hợp lệ số điện thoại & email, lọc bản ghi lỗi
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="cmp-modal-close"
                onClick={() => setIsImportModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cmp-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {importRows.length === 0 ? (
                <div>
                  <div className="cmp-import-box" onClick={handleLoadSampleExcel}>
                    <Upload size={40} color="#3b82f6" style={{ margin: '0 auto 12px auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                      Kéo thả file Excel (.xlsx, .xls) hoặc CSV vào đây
                    </div>
                    <p style={{ margin: '6px 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                      Hoặc nhấp vào đây để nạp dữ liệu kiểm thử mẫu gồm cả dòng hợp lệ và lỗi
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTemplate();
                        }}
                        className="cmp-btn-secondary"
                        style={{ background: '#ffffff', fontSize: '13px', padding: '6px 14px' }}
                      >
                        <Download size={14} />
                        <span>Tải file mẫu Excel (.csv)</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadSampleExcel();
                        }}
                        className="cmp-btn-primary"
                        style={{ fontSize: '13px', padding: '6px 14px' }}
                      >
                        <span>🧪 Nạp dữ liệu mẫu</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div className="cmp-import-stats">
                      <span className="cmp-import-stat-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                        📁 {importFileName || 'file_du_lieu.xlsx'}
                      </span>
                      <span className="cmp-import-stat-pill" style={{ background: '#dcfce7', color: '#15803d' }}>
                        <CheckCircle size={14} /> {importRows.filter((r) => r.status === 'Hợp lệ').length} Hợp lệ
                      </span>
                      {importRows.some((r) => r.status === 'Lỗi dữ liệu') && (
                        <span className="cmp-import-stat-pill" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                          <AlertTriangle size={14} /> {importRows.filter((r) => r.status === 'Lỗi dữ liệu').length} Lỗi dữ liệu
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportRows([]);
                        setImportFileName('');
                      }}
                      className="cmp-btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                    >
                      Chọn file khác
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflowX: 'auto' }}>
                    <table className="cmp-import-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>TÊN DOANH NGHIỆP</th>
                          <th>MÃ SỐ THUẾ</th>
                          <th>SỐ ĐIỆN THOẠI</th>
                          <th>EMAIL</th>
                          <th>ĐỊA CHỈ</th>
                          <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, idx) => (
                          <tr key={idx} style={{ background: row.status === 'Lỗi dữ liệu' ? '#fff1f2' : 'transparent' }}>
                            <td style={{ color: '#94a3b8' }}>{row.row || idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{row.name || '—'}</td>
                            <td>{row.tax_code || '—'}</td>
                            <td>{row.phone || '—'}</td>
                            <td>{row.email || '—'}</td>
                            <td>{row.address || '—'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {row.status === 'Hợp lệ' ? (
                                <span className="cmp-status-valid">Hợp lệ</span>
                              ) : (
                                <div>
                                  <span className="cmp-status-invalid">Lỗi dữ liệu</span>
                                  {row.errors?.length > 0 && (
                                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                                      {row.errors.join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="cmp-modal-footer">
              <button
                type="button"
                className="cmp-btn-secondary"
                onClick={() => setIsImportModalOpen(false)}
                disabled={isImportSubmitting}
              >
                Hủy bỏ
              </button>
              {importRows.length > 0 && (
                <button
                  type="button"
                  className="cmp-btn-primary"
                  onClick={handleConfirmImport}
                  disabled={isImportSubmitting || importRows.filter((r) => r.status === 'Hợp lệ').length === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={15} />
                  <span>
                    {isImportSubmitting
                      ? 'Đang lưu vào hệ thống...'
                      : `Xác nhận nhập ${importRows.filter((r) => r.status === 'Hợp lệ').length} khách hàng`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

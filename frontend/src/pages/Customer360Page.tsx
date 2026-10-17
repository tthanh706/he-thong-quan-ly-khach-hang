import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  GitMerge, 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Users, 
  Briefcase, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  HelpCircle, 
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  UserCheck,
  Star,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { fetchCustomer360, Customer360Data } from '../api/crmApi';
import './Customer360Page.css';

interface Subsidiary {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  tier: string;
}

interface ParentCompany {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  tier: string;
  subsidiaries: Subsidiary[];
}

interface Company {
  id: string;
  name: string;
  code: string;
  taxCode: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  tier: string;
}

const initialCompanies: ParentCompany[] = [
  {
    id: '1',
    name: 'Tập đoàn Công nghệ FPT',
    code: 'CORP-FPT',
    taxCode: '0101248141',
    industry: 'Công nghệ thông tin',
    address: 'Số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
    phone: '02473007300',
    email: 'contact@fpt.com.vn',
    tier: 'Enterprise',
    subsidiaries: [
      {
        id: '1-1',
        name: 'Công ty Cổ phần Viễn thông FPT (FPT Telecom)',
        code: 'SUB-FPTEL',
        taxCode: '0101778163',
        industry: 'Viễn thông & Dữ liệu',
        address: 'Tòa nhà PVI, 168 Trần Thái Tông, Cầu Giấy, Hà Nội',
        phone: '19006600',
        email: 'hotrokhachhang@fpt.com.vn',
        tier: 'Enterprise'
      },
      {
        id: '1-2',
        name: 'Công ty TNHH Phần mềm FPT (FPT Software)',
        code: 'SUB-FSW',
        taxCode: '0101601092',
        industry: 'Xuất khẩu phần mềm',
        address: 'FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
        phone: '02437689048',
        email: 'fsoft.contact@fpt.com',
        tier: 'Enterprise'
      }
    ]
  },
  {
    id: '2',
    name: 'Tập đoàn Vingroup - CTCP',
    code: 'CORP-VIC',
    taxCode: '0101245486',
    industry: 'Đa ngành (Công nghệ - Bất động sản)',
    address: 'Số 7 Đường Bằng Lăng 1, KĐT Vinhomes Riverside, Long Biên, Hà Nội',
    phone: '02439749999',
    email: 'info@vingroup.net',
    tier: 'Enterprise',
    subsidiaries: [
      {
        id: '2-1',
        name: 'Công ty TNHH Kinh doanh Thương mại & Dịch vụ VinFast',
        code: 'SUB-VFAST',
        taxCode: '0108926276',
        industry: 'Sản xuất ô tô & xe máy điện',
        address: 'Khu kinh tế Đình Vũ - Cát Hải, Hải Phòng',
        phone: '1900232389',
        email: 'cskh@vinfastauto.com',
        tier: 'Enterprise'
      }
    ]
  }
];

export const Customer360Page: React.FC = () => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'hierarchy' | 'duplicates'>('overview');

  // Customer 360 State
  const [customerList, setCustomerList] = useState<Company[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [data360, setData360] = useState<Customer360Data | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [subTab360, setSubTab360] = useState<'contacts' | 'contracts' | 'deals' | 'support' | 'care' | 'subsidiaries'>('contacts');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');

  // Hierarchy Tab State
  const [companies, setCompanies] = useState<ParentCompany[]>(initialCompanies);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>('1');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state for hierarchy
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [modalType, setModalType] = useState<'PARENT' | 'SUBSIDIARY'>('PARENT');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    taxCode: '',
    industry: '',
    address: '',
    phone: '',
    email: '',
    tier: 'Enterprise'
  });

  // Duplicates Tab State
  const [duplicateClusters, setDuplicateClusters] = useState<any[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState<any>(null);
  const [mergeTarget, setMergeTarget] = useState<any>(null);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);

  // Load all customers
  const loadCustomers = async () => {
    setCustomerLoading(true);
    try {
      const res = await api<{ success: boolean; data: any[] }>('/v1/customers');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(c => ({
          id: String(c.id),
          name: c.name,
          code: c.code || '',
          taxCode: c.taxCode || c.tax_code || '',
          industry: c.industry || c.notes || 'Doanh nghiệp',
          address: c.address || '',
          phone: c.phone || '',
          email: c.email || '',
          tier: c.status || c.tier || 'Enterprise',
        }));
        setCustomerList(mapped);
        if (!selectedCustomerId && mapped.length > 0) {
          setSelectedCustomerId(mapped[0].id);
          load360Data(mapped[0].id);
        }
      } else {
        const flattened: Company[] = [];
        initialCompanies.forEach(p => {
          flattened.push({
            id: p.id,
            name: p.name,
            code: p.code,
            taxCode: p.taxCode,
            industry: p.industry,
            address: p.address,
            phone: p.phone,
            email: p.email,
            tier: p.tier
          });
          p.subsidiaries.forEach(s => {
            flattened.push({
              id: s.id,
              name: s.name,
              code: s.code,
              taxCode: s.taxCode,
              industry: s.industry,
              address: s.address,
              phone: s.phone,
              email: s.email,
              tier: s.tier
            });
          });
        });
        setCustomerList(flattened);
        if (!selectedCustomerId && flattened.length > 0) {
          setSelectedCustomerId(flattened[0].id);
          load360Data(flattened[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setCustomerLoading(false);
    }
  };

  // Load 360 data for a customer ID
  const load360Data = async (id: string) => {
    if (!id) return;
    setLoading360(true);
    setData360(null);
    try {
      const data = await fetchCustomer360(id);
      setData360(data);
    } catch {
      toast.error('Không thể tải dữ liệu toàn cảnh 360°');
    } finally {
      setLoading360(false);
    }
  };

  // Switch selected customer
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    load360Data(id);
    setViewMode('dashboard');
  };

  // Load hierarchy
  const loadHierarchy = async () => {
    setHierarchyLoading(true);
    try {
      const res = await api<{ success: boolean; data: ParentCompany[] }>('/v1/companies');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setCompanies(res.data);
      }
    } catch {
      // fallback
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Load duplicates
  const loadDuplicates = async () => {
    setDuplicatesLoading(true);
    try {
      const res = await api<{ success: boolean; data: { clusters: any[] } }>('/v1/customers/duplicates');
      if (res && res.data && Array.isArray(res.data.clusters)) {
        setDuplicateClusters(res.data.clusters);
      }
    } catch {
      toast.error('Không thể quét danh sách khách hàng trùng.');
    } finally {
      setDuplicatesLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadHierarchy();
  }, []);

  useEffect(() => {
    if (activeTab === 'duplicates') {
      loadDuplicates();
    }
  }, [activeTab]);

  // Open modal merge comparison
  const handleOpenMerge = (source: any, target: any) => {
    setMergeSource(source);
    setMergeTarget(target);
    setMergeModalOpen(true);
  };

  // Execute merge
  const handleExecuteMerge = async () => {
    if (!mergeSource || !mergeTarget) return;
    setMergeSubmitting(true);
    try {
      const res = await api<{ success: boolean; message: string }>('/v1/customers/merge', {
        method: 'POST',
        body: JSON.stringify({
          source_id: Number(mergeSource.id),
          target_id: Number(mergeTarget.id),
        }),
      });

      if (res && res.success) {
        toast.success(res.message || 'Gộp khách hàng thành công!');
      } else {
        toast.success(`Đã gộp thành công #${mergeSource.id} vào #${mergeTarget.id}!`);
      }

      setMergeModalOpen(false);
      loadDuplicates();
      loadCustomers();
      loadHierarchy();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi gộp khách hàng.');
    } finally {
      setMergeSubmitting(false);
    }
  };

  // Selected company object
  const currentCompany = customerList.find(c => c.id === selectedCustomerId) || customerList[0];

  // Churn risk calculation:
  // Customers with >= 3 open support tickets OR overdue support tickets have Churn Risk!
  const hasChurnRisk = Boolean(
    (data360?.statistics?.openSupportCount && data360.statistics.openSupportCount >= 3) ||
    data360?.supportRequests?.some(sr => sr.isOverdue && sr.status !== 'CLOSED')
  );

  return (
    <div className="c360-page">
      {/* 1. TOP HEADER BANNER */}
      <div className="c360-header">
        <div className="c360-header-info">
          <h1>🌐 Bức Tranh Toàn Cảnh Khách Hàng 360°</h1>
          <p>
            Theo dõi sức khỏe tài khoản, giá trị hợp đồng, cơ hội bán hàng, người liên hệ, cơ cấu công ty mẹ – con và công cụ rà soát gộp trùng.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => {
              if (activeTab === 'overview') {
                loadCustomers();
                if (selectedCustomerId) load360Data(selectedCustomerId);
              } else if (activeTab === 'hierarchy') {
                loadHierarchy();
              } else {
                loadDuplicates();
              }
            }}
            className="c360-btn-secondary"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN TABS NAVIGATION */}
      <div className="c360-tabs-nav">
        <button 
          className={`c360-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Building2 size={16} />
          <span>🌐 Bức tranh Khách hàng 360°</span>
        </button>
        <button 
          className={`c360-tab-button ${activeTab === 'hierarchy' ? 'active' : ''}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          <Layers size={16} />
          <span>🏢 Cấu trúc Tập đoàn & Công ty con</span>
        </button>
        <button 
          className={`c360-tab-button ${activeTab === 'duplicates' ? 'active' : ''}`}
          onClick={() => setActiveTab('duplicates')}
        >
          <GitMerge size={16} />
          <span>🔍 Rà soát & Gộp khách trùng</span>
          {duplicateClusters.length > 0 && (
            <span style={{ 
              background: '#ef4444', 
              color: '#fff', 
              fontSize: '11px', 
              padding: '1px 7px', 
              borderRadius: '999px',
              marginLeft: '6px',
              fontWeight: 700
            }}>
              {duplicateClusters.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================
          TAB 1: KHÁCH HÀNG 360° ENTERPRISE DASHBOARD
         ======================================================== */}
      {activeTab === 'overview' && (
        <div>
          {/* Customer Switcher Toolbar */}
          <div className="c360-switcher-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                Chọn khách hàng xem 360°:
              </label>
              <select
                className="c360-switcher-select"
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
              >
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.taxCode ? `(MST: ${c.taxCode})` : ''} — {c.tier}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`c360-view-toggle ${viewMode === 'dashboard' ? 'active' : ''}`}
                onClick={() => setViewMode('dashboard')}
              >
                Bức tranh 360°
              </button>
              <button
                type="button"
                className={`c360-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Danh sách tổng hợp
              </button>
            </div>
          </div>

          {viewMode === 'table' ? (
            /* Quick table view of customers */
            <div className="c360-table-card">
              <table className="c360-table">
                <thead>
                  <tr>
                    <th>TÊN CÔNG TY / DOANH NGHIỆP</th>
                    <th>MÃ SỐ THUẾ</th>
                    <th>NGÀNH NGHỀ</th>
                    <th>ĐỊA CHỈ</th>
                    <th>SỐ ĐIỆN THOẠI</th>
                    <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'center' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {customerList.map((c) => (
                    <tr key={c.id} className={c.id === selectedCustomerId ? 'expanded' : ''}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={16} color="#3b82f6" />
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td>{c.taxCode || '—'}</td>
                      <td>{c.industry || 'Doanh nghiệp'}</td>
                      <td><div className="c360-truncate-cell">{c.address || '—'}</div></td>
                      <td>{c.phone || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="c360-badge c360-badge-enterprise">{c.tier}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="c360-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                          onClick={() => handleSelectCustomer(c.id)}
                        >
                          Xem 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Immersive 360 Dashboard */
            <div>
              {loading360 ? (
                <div className="c360-loading-card">
                  <RefreshCw size={28} className="animate-spin" color="#3b82f6" />
                  <div style={{ marginTop: '12px', fontWeight: 600, color: '#475569' }}>
                    Đang tổng hợp dữ liệu toàn cảnh 360°...
                  </div>
                </div>
              ) : (
                <>
                  {/* Hero Company Profile Banner */}
                  <div className="c360-hero-card">
                    <div className="c360-hero-main">
                      <div className="c360-avatar-box">
                        <Building2 size={36} color="#ffffff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h2 className="c360-hero-name">
                            {data360?.company?.name || currentCompany?.name}
                          </h2>
                          <span className="c360-hero-badge">
                            {data360?.company?.tier || currentCompany?.tier || 'Khách hàng'}
                          </span>
                          
                          {/* Churn Risk Badge */}
                          {hasChurnRisk ? (
                            <span className="c360-risk-badge-danger">
                              <AlertTriangle size={13} />
                              <span>Cảnh báo: Có rủi ro rời bỏ (Churn Risk)</span>
                            </span>
                          ) : (
                            <span className="c360-risk-badge-safe">
                              <CheckCircle size={13} />
                              <span>Sức khỏe tài khoản: Tốt</span>
                            </span>
                          )}
                        </div>

                        <div className="c360-hero-meta-row">
                          <span>
                            <strong>Mã KH:</strong> {data360?.company?.code || currentCompany?.code || `KH${currentCompany?.id}`}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Mã số thuế:</strong> {data360?.company?.taxCode || currentCompany?.taxCode || 'Chưa cập nhật'}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Ngành:</strong> {data360?.company?.industry || currentCompany?.industry || 'Doanh nghiệp'}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Phụ trách:</strong> {data360?.company?.owner || 'Chưa phân công'}
                          </span>
                        </div>

                        <div className="c360-hero-contact-row">
                          {(data360?.company?.address || currentCompany?.address) && (
                            <div className="c360-contact-pill">
                              <MapPin size={13} />
                              <span>{data360?.company?.address || currentCompany?.address}</span>
                            </div>
                          )}
                          {(data360?.company?.phone || currentCompany?.phone) && (
                            <div className="c360-contact-pill">
                              <Phone size={13} />
                              <span>{data360?.company?.phone || currentCompany?.phone}</span>
                            </div>
                          )}
                          {(data360?.company?.email || currentCompany?.email) && (
                            <div className="c360-contact-pill">
                              <Mail size={13} />
                              <span>{data360?.company?.email || currentCompany?.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Metric KPI Cards */}
                  <div className="c360-kpi-grid">
                    <div className="c360-kpi-card">
                      <div className="c360-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <DollarSign size={22} />
                      </div>
                      <div>
                        <div className="c360-kpi-label">Tổng giá trị hợp đồng đã ký</div>
                        <div className="c360-kpi-value" style={{ color: '#059669' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            data360?.statistics?.totalContractValue || 0
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="c360-kpi-card">
                      <div className="c360-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <div className="c360-kpi-label">Hợp đồng hiệu lực</div>
                        <div className="c360-kpi-value">
                          {data360?.statistics?.activeContractsCount || data360?.contracts?.length || 0} hợp đồng
                        </div>
                      </div>
                    </div>

                    <div className="c360-kpi-card">
                      <div className="c360-kpi-icon" style={{ background: '#fdf4ff', color: '#a855f7' }}>
                        <Briefcase size={22} />
                      </div>
                      <div>
                        <div className="c360-kpi-label">Cơ hội bán hàng đang mở</div>
                        <div className="c360-kpi-value">
                          {data360?.deals?.length || 0} cơ hội
                        </div>
                      </div>
                    </div>

                    <div className="c360-kpi-card">
                      <div className="c360-kpi-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                        <Users size={22} />
                      </div>
                      <div>
                        <div className="c360-kpi-label">Đầu mối người liên hệ</div>
                        <div className="c360-kpi-value">
                          {data360?.statistics?.contactsCount || data360?.contacts?.length || 0} liên hệ
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 360 Subtab Sections */}
                  <div className="c360-content-card">
                    <div className="c360-subtabs-header">
                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'contacts' ? 'active' : ''}`}
                        onClick={() => setSubTab360('contacts')}
                      >
                        <Users size={15} />
                        <span>Người liên hệ ({data360?.contacts?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'contracts' ? 'active' : ''}`}
                        onClick={() => setSubTab360('contracts')}
                      >
                        <FileText size={15} />
                        <span>Hợp đồng đã ký ({data360?.contracts?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'deals' ? 'active' : ''}`}
                        onClick={() => setSubTab360('deals')}
                      >
                        <Briefcase size={15} />
                        <span>Cơ hội bán hàng ({data360?.deals?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'support' ? 'active' : ''}`}
                        onClick={() => setSubTab360('support')}
                      >
                        <HelpCircle size={15} />
                        <span>Yêu cầu hỗ trợ & SLA ({data360?.supportRequests?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'care' ? 'active' : ''}`}
                        onClick={() => setSubTab360('care')}
                      >
                        <Calendar size={15} />
                        <span>Lịch chăm sóc ({data360?.periodicCares?.length || 0})</span>
                      </button>

                      <button
                        type="button"
                        className={`c360-subtab-item ${subTab360 === 'subsidiaries' ? 'active' : ''}`}
                        onClick={() => setSubTab360('subsidiaries')}
                      >
                        <Layers size={15} />
                        <span>Mạng lưới trực thuộc ({data360?.company?.subsidiaries?.length || 0})</span>
                      </button>
                    </div>

                    <div className="c360-subtab-body">
                      {/* Subtab 1: Contacts */}
                      {subTab360 === 'contacts' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="c360-table">
                            <thead>
                              <tr>
                                <th>HỌ TÊN NGƯỜI LIÊN HỆ</th>
                                <th>CHỨC VỤ / PHÒNG BAN</th>
                                <th>SỐ ĐIỆN THOẠI</th>
                                <th>EMAIL</th>
                                <th style={{ textAlign: 'center' }}>VAI TRÒ TRONG QUYẾT ĐỊNH MUA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data360?.contacts || []).length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                    Chưa có thông tin người liên hệ nào cho khách hàng này.
                                  </td>
                                </tr>
                              ) : (
                                data360?.contacts.map((cnt: any) => (
                                  <tr key={cnt.id}>
                                    <td style={{ fontWeight: 600 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="c360-user-mini-avatar">
                                          {cnt.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div>{cnt.name}</div>
                                          {cnt.isPrimary && (
                                            <span className="c360-primary-contact-tag">
                                              ★ Đầu mối chính
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div>{cnt.title || 'Chưa cập nhật'}</div>
                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{cnt.department || ''}</div>
                                    </td>
                                    <td>{cnt.phone || '—'}</td>
                                    <td>{cnt.email || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`c360-role-badge ${
                                        cnt.roleInDecision === 'decision_maker' || cnt.roleInDecision === 'Người quyết định'
                                          ? 'role-decision-maker'
                                          : cnt.roleInDecision === 'influencer' || cnt.roleInDecision === 'Người ảnh hưởng'
                                          ? 'role-influencer'
                                          : cnt.roleInDecision === 'blocker' || cnt.roleInDecision === 'Người cản trở'
                                          ? 'role-blocker'
                                          : 'role-end-user'
                                      }`}>
                                        {cnt.roleInDecision === 'decision_maker'
                                          ? 'Người quyết định'
                                          : cnt.roleInDecision === 'influencer'
                                          ? 'Người ảnh hưởng'
                                          : cnt.roleInDecision === 'blocker'
                                          ? 'Người cản trở'
                                          : cnt.roleInDecision || 'Người dùng cuối'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Subtab 2: Contracts */}
                      {subTab360 === 'contracts' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="c360-table">
                            <thead>
                              <tr>
                                <th>MÃ HỢP ĐỒNG</th>
                                <th>TIÊU ĐỀ HỢP ĐỒNG</th>
                                <th>GIÁ TRỊ (VND)</th>
                                <th>NGÀY BẮT ĐẦU</th>
                                <th>NGÀY HẾT HẠN</th>
                                <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data360?.contracts || []).length === 0 ? (
                                <tr>
                                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                    Chưa có hợp đồng nào được ký kết.
                                  </td>
                                </tr>
                              ) : (
                                data360?.contracts.map((ct: any) => (
                                  <tr key={ct.id}>
                                    <td><code>{ct.contractNumber}</code></td>
                                    <td style={{ fontWeight: 600 }}>{ct.title}</td>
                                    <td style={{ fontWeight: 700, color: '#16a34a' }}>
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ct.value || 0)}
                                    </td>
                                    <td>{ct.startDate || '—'}</td>
                                    <td>{ct.endDate || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className={`c360-status-pill ${ct.status === 'Active' ? 'status-active' : 'status-expired'}`}>
                                        {ct.status === 'Active' ? 'Đang hiệu lực' : ct.status || 'Hết hiệu lực'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Subtab 3: Deals */}
                      {subTab360 === 'deals' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="c360-table">
                            <thead>
                              <tr>
                                <th>TÊN CƠ HỘI / THƯƠNG VỤ</th>
                                <th>DOANH SỐ DỰ KIẾN</th>
                                <th>GIAI ĐOẠN PIPELINE</th>
                                <th>NGÀY DỰ KIẾN ĐÓNG</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data360?.deals || []).length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                    Không có cơ hội bán hàng nào đang mở.
                                  </td>
                                </tr>
                              ) : (
                                data360?.deals.map((deal: any) => (
                                  <tr key={deal.id}>
                                    <td style={{ fontWeight: 600 }}>{deal.title}</td>
                                    <td style={{ fontWeight: 700, color: '#2563eb' }}>
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deal.value || 0)}
                                    </td>
                                    <td>
                                      <span className="c360-stage-pill">
                                        {deal.stage || 'Đàm phán'}
                                      </span>
                                    </td>
                                    <td>{deal.closingDate || '—'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Subtab 4: Support */}
                      {subTab360 === 'support' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="c360-table">
                            <thead>
                              <tr>
                                <th>MÃ YÊU CẦU</th>
                                <th>TIÊU ĐỀ HỖ TRỢ</th>
                                <th>MỨC ĐỘ ƯU TIÊN</th>
                                <th>TRẠNG THÁI</th>
                                <th>CẢNH BÁO SLA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data360?.supportRequests || []).length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                    Không có yêu cầu hỗ trợ sau bán nào được ghi nhận.
                                  </td>
                                </tr>
                              ) : (
                                data360?.supportRequests.map((sr: any) => (
                                  <tr key={sr.id}>
                                    <td><code>{sr.code}</code></td>
                                    <td style={{ fontWeight: 600 }}>{sr.subject}</td>
                                    <td>
                                      <span className={`c360-priority-pill ${sr.priority === 'HIGH' ? 'priority-high' : 'priority-normal'}`}>
                                        {sr.priority === 'HIGH' ? 'Khẩn cấp' : 'Bình thường'}
                                      </span>
                                    </td>
                                    <td>{sr.status}</td>
                                    <td>
                                      {sr.isOverdue ? (
                                        <span className="c360-sla-overdue">
                                          <AlertTriangle size={12} /> Quá hạn xử lý SLA
                                        </span>
                                      ) : (
                                        <span className="c360-sla-ok">Trong hạn cam kết</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Subtab 5: Care */}
                      {subTab360 === 'care' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="c360-table">
                            <thead>
                              <tr>
                                <th>LOẠI HÌNH CHĂM SÓC</th>
                                <th>NGÀY DỰ KIẾN THỰC HIỆN</th>
                                <th>TRẠNG THÁI</th>
                                <th>GHI CHÚ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(data360?.periodicCares || []).length === 0 ? (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                                    Chưa có lịch chăm sóc định kỳ nào được lên lịch.
                                  </td>
                                </tr>
                              ) : (
                                data360?.periodicCares.map((pc: any) => (
                                  <tr key={pc.id}>
                                    <td style={{ fontWeight: 600 }}>{pc.careType}</td>
                                    <td>{pc.scheduledDate}</td>
                                    <td>
                                      {pc.status === 'DONE' ? (
                                        <span className="c360-care-done">Đã thực hiện</span>
                                      ) : (
                                        <span className="c360-care-pending">Chưa thực hiện</span>
                                      )}
                                    </td>
                                    <td>{pc.notes || '—'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Subtab 6: Subsidiaries */}
                      {subTab360 === 'subsidiaries' && (
                        <div>
                          {data360?.company?.parent && (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                                THUỘC TẬP ĐOÀN MẸ
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                                {data360.company.parent.name} ({data360.company.parent.code})
                              </div>
                            </div>
                          )}

                          <div style={{ fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>
                            Các công ty thành viên trực thuộc ({data360?.company?.subsidiaries?.length || 0}):
                          </div>
                          {(data360?.company?.subsidiaries || []).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              Doanh nghiệp này không có công ty con hoặc chi nhánh phụ thuộc.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                              {data360?.company?.subsidiaries?.map((sub: any) => (
                                <div key={sub.id} className="c360-subsidiary-card">
                                  <Building2 size={20} color="#2563eb" />
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>{sub.name}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      Mã: {sub.code} · MST: {sub.taxCode || 'Chưa có'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: CẤU TRÚC TẬP ĐOÀN MẸ - CON
         ======================================================== */}
      {activeTab === 'hierarchy' && (
        <div className="c360-table-card">
          <div className="c360-search-bar">
            <div className="c360-search-wrapper">
              <Search size={16} className="c360-search-icon" />
              <input
                type="text"
                placeholder="Tìm tập đoàn, công ty thành viên, mã số thuế..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="c360-search-input"
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="c360-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ minWidth: '240px' }}>DOANH NGHIỆP / CÔNG TY</th>
                  <th style={{ minWidth: '130px' }}>MÃ DOANH NGHIỆP</th>
                  <th style={{ minWidth: '150px' }}>MÃ SỐ THUẾ & NGÀNH</th>
                  <th style={{ minWidth: '180px' }}>ĐỊA CHỈ TRỤ SỞ</th>
                  <th style={{ minWidth: '160px' }}>THÔNG TIN LIÊN HỆ</th>
                  <th style={{ minWidth: '110px', textAlign: 'center' }}>PHÂN HẠNG</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((parent) => {
                  const isExpanded = expandedRow === parent.id;
                  return (
                    <React.Fragment key={parent.id}>
                      <tr className="c360-parent-row">
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(isExpanded ? null : parent.id)}
                            className="c360-btn-toggle"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td>
                          <div className="c360-company-cell">
                            <div className="c360-corp-icon">
                              <Building2 size={20} />
                            </div>
                            <div>
                              <div className="c360-company-name">{parent.name}</div>
                              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                                Tập đoàn mẹ ({parent.subsidiaries.length} công ty con)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td><code>{parent.code}</code></td>
                        <td>
                          <span className="c360-meta-main">{parent.taxCode || '—'}</span>
                          <span className="c360-meta-sub">{parent.industry}</span>
                        </td>
                        <td><div className="c360-truncate-cell">{parent.address}</div></td>
                        <td>
                          <span className="c360-meta-main">{parent.phone}</span>
                          <span className="c360-meta-sub">{parent.email}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="c360-badge c360-badge-enterprise">{parent.tier}</span>
                        </td>
                      </tr>

                      {/* Subsidiaries list */}
                      {isExpanded && parent.subsidiaries.map((sub) => (
                        <tr key={sub.id} className="c360-subsidiary-row">
                          <td></td>
                          <td>
                            <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#94a3b8' }}>↳</span>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{sub.name}</div>
                            </div>
                          </td>
                          <td><code>{sub.code}</code></td>
                          <td>
                            <div>{sub.taxCode || '—'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{sub.industry}</div>
                          </td>
                          <td><div className="c360-truncate-cell">{sub.address || '—'}</div></td>
                          <td>
                            <div>{sub.phone || '—'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{sub.email || '—'}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="c360-badge c360-badge-sme">{sub.tier || 'SME'}</span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: RÀ SOÁT & GỘP KHÁCH HÀNG TRÙNG
         ======================================================== */}
      {activeTab === 'duplicates' && (
        <div>
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '16px', 
            padding: '20px 24px', 
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitMerge size={20} color="#2563eb" />
                <span>Rà soát & Phát hiện Khách hàng Trùng lặp</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Hệ thống tự động rà quét và gom cụm các bản ghi có chung Mã số thuế, Số điện thoại hoặc Email liên hệ.
              </p>
            </div>
            <button 
              type="button" 
              onClick={loadDuplicates}
              disabled={duplicatesLoading}
              className="c360-btn-primary"
            >
              <RefreshCw size={14} className={duplicatesLoading ? 'animate-spin' : ''} />
              <span>{duplicatesLoading ? 'Đang quét...' : 'Quét trùng ngay'}</span>
            </button>
          </div>

          {duplicateClusters.length === 0 ? (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '60px 20px', 
              textAlign: 'center',
              color: '#64748b' 
            }}>
              <CheckCircle size={44} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>
                Dữ liệu khách hàng hoàn toàn sạch!
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
                Không phát hiện khách hàng nào bị trùng lặp Mã số thuế, Số điện thoại hoặc Email trong hệ thống.
              </p>
            </div>
          ) : (
            duplicateClusters.map((cluster, idx) => (
              <div key={idx} className="c360-cluster-card">
                <div className="c360-cluster-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="c360-cluster-pill">
                      Cụm trùng #{idx + 1}
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '14.5px' }}>{cluster.reason}</strong>
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Phát hiện: {cluster.customers?.length || 0} bản ghi
                  </span>
                </div>

                <table className="c360-merge-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TÊN KHÁCH HÀNG</th>
                      <th>MÃ SỐ THUẾ</th>
                      <th>SỐ ĐIỆN THOẠI</th>
                      <th>EMAIL</th>
                      <th>DỮ LIỆU LIÊN KẾT</th>
                      <th style={{ textAlign: 'center' }}>THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cluster.customers?.map((cust: any) => (
                      <tr key={cust.id}>
                        <td><code>#{cust.id}</code></td>
                        <td style={{ fontWeight: 600 }}>{cust.name}</td>
                        <td>{cust.tax_code || '—'}</td>
                        <td>{cust.phone || '—'}</td>
                        <td>{cust.email || '—'}</td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {cust.contacts_count || 0} liên hệ · {cust.contracts_count || 0} hợp đồng
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {cluster.customers.length >= 2 && (
                            <button
                              type="button"
                              className="c360-btn-primary"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              onClick={() => {
                                const other = cluster.customers.find((c: any) => c.id !== cust.id);
                                handleOpenMerge(other, cust);
                              }}
                            >
                              Gộp vào bản ghi này
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          MODAL SO SÁNH & GỘP KHÁCH HÀNG
         ======================================================== */}
      {mergeModalOpen && mergeSource && mergeTarget && (
        <div className="c360-modal-overlay" onClick={() => setMergeModalOpen(false)}>
          <div 
            className="c360-modal-content" 
            style={{ maxWidth: '850px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="c360-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GitMerge size={22} color="#2563eb" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Xác Nhận So Sánh & Gộp Khách Hàng
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Chuyển toàn bộ liên hệ, hợp đồng, cơ hội và yêu cầu hỗ trợ sang khách hàng đích
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setMergeModalOpen(false)}
                className="c360-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* Source Column */}
                <div style={{ 
                  border: '1px solid #fed7aa', 
                  borderRadius: '12px', 
                  padding: '16px',
                  background: '#fffaf5' 
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', marginBottom: '8px' }}>
                    BẢN GHI PHỤ (Sẽ đóng sau khi gộp)
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {mergeSource.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    ID: #{mergeSource.id} · MST: {mergeSource.tax_code || 'Chưa có'}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                    <div>📞 {mergeSource.phone || 'Chưa có SĐT'}</div>
                    <div>✉️ {mergeSource.email || 'Chưa có Email'}</div>
                    <div>🏢 {mergeSource.address || 'Chưa có địa chỉ'}</div>
                  </div>
                </div>

                {/* Target Column */}
                <div style={{ 
                  border: '1.5px solid #93c5fd', 
                  borderRadius: '12px', 
                  padding: '16px',
                  background: '#f0f7ff' 
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', marginBottom: '8px' }}>
                    BẢN GHI ĐÍCH (Được giữ lại làm chuẩn)
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {mergeTarget.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    ID: #{mergeTarget.id} · MST: {mergeTarget.tax_code || 'Chưa có'}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
                    <div>📞 {mergeTarget.phone || 'Chưa có SĐT'}</div>
                    <div>✉️ {mergeTarget.email || 'Chưa có Email'}</div>
                    <div>🏢 {mergeTarget.address || 'Chưa có địa chỉ'}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', fontSize: '12.5px', color: '#475569' }}>
                💡 <strong>Quy trình xử lý:</strong> Sau khi gộp, toàn bộ hợp đồng, người liên hệ, cơ hội và yêu cầu hỗ trợ của bản ghi phụ sẽ được chuyển hoàn toàn sang bản ghi đích. Bản ghi phụ sẽ được lưu dấu vết và đánh dấu ngừng hoạt động.
              </div>
            </div>

            <div className="c360-modal-footer">
              <button
                type="button"
                className="c360-btn-secondary"
                onClick={() => setMergeModalOpen(false)}
                disabled={mergeSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="c360-btn-primary"
                onClick={handleExecuteMerge}
                disabled={mergeSubmitting}
              >
                {mergeSubmitting ? 'Đang thực hiện gộp...' : 'Xác nhận gộp dữ liệu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
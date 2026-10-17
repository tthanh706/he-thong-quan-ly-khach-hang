import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  Plus,
  History,
  Edit,
  DollarSign,
  Calendar,
  User,
  Shield,
  Layers,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { salesOpportunityService } from '../services/salesOpportunityService';
import type {
  SalesOpportunity,
  CreateOpportunityData,
  UpdateOpportunityData,
  OpportunityCustomer,
  OpportunityOwner,
  StageConfig,
  OpportunityHistoryItem,
} from '../types/salesOpportunity';
import './OpportunityManagementPage.css';

export const OpportunityManagementPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');

  // Dropdown options
  const [customers, setCustomers] = useState<OpportunityCustomer[]>([]);
  const [users, setUsers] = useState<OpportunityOwner[]>([]);
  const [stages, setStages] = useState<StageConfig[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  // Modal Tạo cơ hội (S5-01)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const [createForm, setCreateForm] = useState<CreateOpportunityData>({
    name: '',
    customer_id: 0,
    contact_id: undefined,
    stage: 'khao_sat',
    value: 50000000,
    expected_close_date: todayStr,
    source: 'Trực tiếp',
    win_probability: 10,
    probability_note: '',
    owner_user_id: undefined,
    notes: '',
  });
  const [isProbabilityCustomized, setIsProbabilityCustomized] = useState<boolean>(false);

  // Modal Chỉnh sửa cơ hội (kèm audit log S6-01)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingOpp, setEditingOpp] = useState<SalesOpportunity | null>(null);
  const [editForm, setEditForm] = useState<UpdateOpportunityData>({
    name: '',
    customer_id: 0,
    contact_id: undefined,
    stage: '',
    value: 0,
    expected_close_date: '',
    source: '',
    win_probability: 0,
    probability_note: '',
    owner_user_id: undefined,
    notes: '',
    change_reason: '',
  });

  // Modal Lịch sử thay đổi (S6-01)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [activeHistoryOpp, setActiveHistoryOpp] = useState<SalesOpportunity | null>(null);
  const [histories, setHistories] = useState<OpportunityHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Tải danh sách cơ hội
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const res = await salesOpportunityService.getOpportunities({
        search: searchTerm,
        stage: stageFilter,
        customer_id: customerFilter,
        owner_user_id: ownerFilter,
      });
      setOpportunities(res.data.data);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách cơ hội');
    } finally {
      setLoading(false);
    }
  };

  // Tải danh mục dropdown
  const fetchOptions = async () => {
    try {
      const res = await salesOpportunityService.getFormOptions();
      setCustomers(res.customers);
      setUsers(res.users);
      setStages(res.stages);
      setSources(res.sources);
    } catch (err) {
      console.error('Lỗi tải form options:', err);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [searchTerm, stageFilter, customerFilter, ownerFilter]);

  // Khi thay đổi giai đoạn trong form tạo: tự động cập nhật xác suất mặc định theo S5-01
  const handleStageChangeInCreate = (newStage: string) => {
    const stageObj = stages.find((s) => s.key === newStage);
    const defaultProb = stageObj ? stageObj.probability : 10;

    setCreateForm((prev) => ({
      ...prev,
      stage: newStage,
      win_probability: isProbabilityCustomized ? prev.win_probability : defaultProb,
    }));
  };

  // Mở modal tạo mới cơ hội
  const handleOpenCreateModal = () => {
    setIsProbabilityCustomized(false);
    setCreateForm({
      name: '',
      customer_id: customers.length > 0 ? customers[0].id : 0,
      contact_id: undefined,
      stage: 'khao_sat',
      value: 100000000,
      expected_close_date: todayStr,
      source: 'Trực tiếp',
      win_probability: 10,
      probability_note: '',
      owner_user_id: undefined,
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  // Submit tạo cơ hội mới (S5-01)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập tên cơ hội bán hàng');
      return;
    }
    if (!createForm.customer_id) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (!createForm.expected_close_date) {
      toast.error('Vui lòng chọn ngày dự kiến chốt');
      return;
    }

    // Validate ngày không ở quá khứ khi tạo mới (S5-01)
    if (createForm.expected_close_date < todayStr) {
      toast.error('Ngày dự kiến chốt không được ở quá khứ khi tạo mới!');
      return;
    }

    // Nếu sửa tay xác suất thì yêu cầu ghi chú
    const stageObj = stages.find((s) => s.key === createForm.stage);
    const defaultProb = stageObj ? stageObj.probability : 10;
    if (createForm.win_probability !== defaultProb && !createForm.probability_note?.trim()) {
      toast.error('Vui lòng nhập ghi chú giải thích khi sửa tay xác suất thắng!');
      return;
    }

    try {
      await salesOpportunityService.createOpportunity(createForm);
      toast.success('Tạo cơ hội bán hàng thành công!');
      setIsCreateModalOpen(false);
      fetchOpportunities();
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo cơ hội bán hàng');
    }
  };

  // Mở modal sửa cơ hội (S5-01 + S6-01)
  const handleOpenEditModal = (opp: SalesOpportunity) => {
    setEditingOpp(opp);
    setEditForm({
      name: opp.name,
      customer_id: opp.customer_id,
      contact_id: opp.contact_id,
      stage: opp.stage,
      value: opp.value,
      expected_close_date: opp.expected_close_date ? opp.expected_close_date.split('T')[0] : '',
      source: opp.source || 'Trực tiếp',
      win_probability: opp.win_probability,
      probability_note: opp.probability_note || '',
      owner_user_id: opp.owner_user_id || opp.owner_id,
      notes: opp.notes || '',
      change_reason: '',
    });
    setIsEditModalOpen(true);
  };

  // Submit cập nhật cơ hội (tự động lưu audit log S6-01)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;

    try {
      await salesOpportunityService.updateOpportunity(editingOpp.id, editForm);
      toast.success('Cập nhật cơ hội và ghi nhận lịch sử thành công!');
      setIsEditModalOpen(false);
      fetchOpportunities();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật cơ hội');
    }
  };

  // Xem lịch sử thay đổi (S6-01)
  const handleViewHistory = async (opp: SalesOpportunity) => {
    setActiveHistoryOpp(opp);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await salesOpportunityService.getHistories(opp.id);
      setHistories(res.histories);
    } catch (err: any) {
      toast.error(err.message || 'Không thể lấy lịch sử thay đổi');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Contacts cho dropdown của khách hàng đã chọn
  const selectedCustomerInCreate = customers.find(
    (c) => c.id === Number(createForm.customer_id)
  );
  const contactsForCreate = selectedCustomerInCreate?.contacts || [];

  const selectedCustomerInEdit = customers.find(
    (c) => c.id === Number(editForm.customer_id)
  );
  const contactsForEdit = selectedCustomerInEdit?.contacts || [];

  // Tổng hợp thống kê
  const totalValue = opportunities.reduce((acc, o) => acc + Number(o.value || o.amount || 0), 0);
  const wonCount = opportunities.filter((o) => o.stage === 'won' || o.status === 'won').length;
  const inProgressCount = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost').length;

  return (
    <div className="opp-container">
      {/* Header */}
      <div className="opp-header">
        <div className="opp-title-group">
          <h1>
            <TrendingUp className="text-blue-600" size={26} />
            Quản Lý Cơ Hội Bán Hàng & Lịch Sử Thay Đổi
          </h1>
          <p>
            Khai báo và theo dõi các thương vụ bán hàng theo giai đoạn và xác suất thắng; tự động ghi nhận mọi thay đổi (giai đoạn, giá trị, ngày chốt, người sở hữu) để phục vụ giám sát minh bạch.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          Tạo cơ hội bán hàng
        </button>
      </div>

      {/* Stats Cards */}
      <div className="opp-stats-row">
        <div className="opp-stat-card">
          <div className="opp-stat-icon blue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng giá trị cơ hội</span>
            <span className="stat-val">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                totalValue
              )}
            </span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-icon purple">
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đang triển khai</span>
            <span className="stat-val">{inProgressCount} thương vụ</span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Thành công (Won)</span>
            <span className="stat-val">{wonCount} cơ hội</span>
          </div>
        </div>

        <div className="opp-stat-card">
          <div className="opp-stat-icon amber">
            <History size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Nhật ký thay đổi</span>
            <span className="stat-val">Tự động ghi nhận</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="opp-filters-bar">
        <div className="opp-filter-inputs">
          <input
            type="text"
            className="opp-search-input"
            placeholder="Tìm theo tên cơ hội, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="opp-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">Tất cả giai đoạn</option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.probability}%)
              </option>
            ))}
          </select>

          <select
            className="opp-select"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          >
            <option value="">Tất cả khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          <select
            className="opp-select"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
          >
            <option value="">Tất cả nhân viên phụ trách</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="opp-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Đang tải dữ liệu cơ hội bán hàng...
          </div>
        ) : opportunities.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Chưa có cơ hội bán hàng nào phù hợp với bộ lọc. Nhấp vào <strong>"Tạo cơ hội bán hàng"</strong> để thêm mới!
          </div>
        ) : (
          <table className="opp-table">
            <thead>
              <tr>
                <th>Tên cơ hội & Khách hàng</th>
                <th>Người liên hệ chính</th>
                <th>Giai đoạn</th>
                <th>Giá trị dự kiến</th>
                <th>Xác suất thắng</th>
                <th>Ngày dự kiến chốt</th>
                <th>Người sở hữu</th>
                <th>Lịch sử thay đổi</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => {
                const stageObj = stages.find((s) => s.key === opp.stage);
                const stageLabel = stageObj?.label || opp.stage;
                const stageColor = stageObj?.color || '#3b82f6';

                return (
                  <tr key={opp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{opp.name}</div>
                      <div style={{ fontSize: '13px', color: '#2563eb', marginTop: '2px' }}>
                        🏢 {opp.customer?.name || 'Khách hàng chưa gán'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Nguồn: {opp.source || 'Trực tiếp'}
                      </div>
                    </td>
                    <td>
                      {opp.contact ? (
                        <div>
                          <div style={{ fontWeight: 500, color: '#334155' }}>
                            {opp.contact.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {opp.contact.phone || opp.contact.title || 'Liên hệ chính'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>— Chưa gán —</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="stage-badge"
                        style={{
                          backgroundColor: `${stageColor}15`,
                          color: stageColor,
                          border: `1px solid ${stageColor}40`,
                        }}
                      >
                        {stageLabel}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {new Intl.NumberFormat('vi-VN').format(opp.value || opp.amount || 0)} đ
                      </div>
                    </td>
                    <td>
                      <div
                        className={`prob-badge ${
                          opp.win_probability_customized ? 'custom' : 'default'
                        }`}
                        title={
                          opp.win_probability_customized
                            ? `Xác suất đã sửa tay kèm ghi chú: ${opp.probability_note || ''}`
                            : 'Xác suất lấy mặc định theo giai đoạn'
                        }
                      >
                        {opp.win_probability}%
                        {opp.win_probability_customized && (
                          <span style={{ fontSize: '10px' }}>✏️ sửa tay</span>
                        )}
                      </div>
                      {opp.probability_note && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#b45309',
                            maxWidth: '130px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={opp.probability_note}
                        >
                          {opp.probability_note}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#334155' }}>
                        <Calendar size={13} color="#64748b" />
                        {opp.expected_close_date
                          ? new Date(opp.expected_close_date).toLocaleDateString('vi-VN')
                          : '—'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#334155' }}>
                        <User size={13} color="#64748b" />
                        {opp.owner?.name || 'Chưa gán'}
                      </div>
                    </td>
                    <td>
                      <button
                        className="history-badge"
                        onClick={() => handleViewHistory(opp)}
                        title="Xem lịch sử thay đổi giai đoạn, giá trị, ngày chốt..."
                      >
                        <History size={13} />
                        {opp.histories_count ? `${opp.histories_count} logs` : 'Lịch sử'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-action-icon primary"
                          onClick={() => handleOpenEditModal(opp)}
                          title="Chỉnh sửa cơ hội (Ghi log tự động)"
                        >
                          <Edit size={14} />
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: TẠO CƠ HỘI BÁN HÀNG MỚI (S5-01) */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Tạo mới cơ hội bán hàng</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    Tên cơ hội bán hàng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Triển khai phần mềm CRM cho Tập đoàn FPT"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Khách hàng <span style={{ color: '#ef4444' }}>*</span> (1 KH có thể có nhiều cơ hội)
                    </label>
                    <select
                      required
                      value={createForm.customer_id}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          customer_id: Number(e.target.value),
                          contact_id: undefined,
                        })
                      }
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Người liên hệ chính</label>
                    <select
                      value={createForm.contact_id || ''}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          contact_id: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    >
                      <option value="">-- Chọn người liên hệ --</option>
                      {contactsForCreate.map((cnt) => (
                        <option key={cnt.id} value={cnt.id}>
                          {cnt.name} {cnt.title ? `(${cnt.title})` : ''}{' '}
                          {cnt.is_primary ? '★ Chính' : ''}
                        </option>
                      ))}
                    </select>
                    {contactsForCreate.length === 0 && (
                      <div className="form-help">Khách hàng này chưa có danh bạ người liên hệ.</div>
                    )}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Giai đoạn bán hàng <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      required
                      value={createForm.stage}
                      onChange={(e) => handleStageChangeInCreate(e.target.value)}
                    >
                      {stages.map((stg) => (
                        <option key={stg.key} value={stg.key}>
                          {stg.label} (Mặc định: {stg.probability}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Giá trị dự kiến (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000000}
                      value={createForm.value}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, value: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Ngày dự kiến chốt <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr} // Tiêu chí S5-01: Ngày dự kiến chốt không được ở quá khứ khi tạo mới
                      value={createForm.expected_close_date}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, expected_close_date: e.target.value })
                      }
                    />
                    <div className="form-help">
                      Ràng buộc nghiệp vụ: Không được chọn ngày trong quá khứ khi tạo mới.
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nguồn cơ hội</label>
                    <select
                      value={createForm.source}
                      onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                    >
                      {sources.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tiêu chí S5-01: Xác suất thắng lấy mặc định theo giai đoạn, sửa tay được kèm ghi chú */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <label style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>
                      Xác suất thành công (%)
                    </label>
                    <label
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        color: '#2563eb',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isProbabilityCustomized}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsProbabilityCustomized(checked);
                          if (!checked) {
                            const curStage = stages.find((s) => s.key === createForm.stage);
                            setCreateForm((prev) => ({
                              ...prev,
                              win_probability: curStage ? curStage.probability : 10,
                              probability_note: '',
                            }));
                          }
                        }}
                      />
                      Cho phép sửa tay xác suất thắng
                    </label>
                  </div>

                  <div className="form-group-row" style={{ marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={!isProbabilityCustomized}
                        value={createForm.win_probability}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            win_probability: Number(e.target.value),
                          })
                        }
                      />
                      <div className="form-help">
                        {isProbabilityCustomized
                          ? 'Đã mở khóa sửa tay xác suất (Yêu cầu nhập ghi chú lý do)'
                          : 'Đang dùng xác suất mặc định theo giai đoạn hiện tại'}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        disabled={!isProbabilityCustomized}
                        required={isProbabilityCustomized}
                        placeholder="Ghi chú lý do điều chỉnh xác suất..."
                        value={createForm.probability_note}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            probability_note: e.target.value,
                          })
                        }
                      />
                      <div className="form-help">Vui lòng nhập ghi chú giải thích khi sửa tay xác suất.</div>
                    </div>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Nhân viên sở hữu / Phụ trách</label>
                    <select
                      value={createForm.owner_user_id || ''}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          owner_user_id: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    >
                      <option value="">-- Mặc định (Người tạo hiện tại) --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Ghi chú cơ hội</label>
                    <input
                      type="text"
                      placeholder="Thông tin thêm về giải pháp, đối thủ..."
                      value={createForm.notes || ''}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo cơ hội bán hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA CƠ HỘI & GHI LOG THAY ĐỔI (S6-01) */}
      {isEditModalOpen && editingOpp && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Chỉnh sửa cơ hội bán hàng & Ghi nhật ký: <span>{editingOpp.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="alert-antispam" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                  <Shield size={18} />
                  <span>
                    <strong>Hệ thống Audit Log tự động:</strong> Mọi thay đổi về Giai đoạn, Giá trị, Ngày chốt, Người sở hữu sẽ được lưu vào lịch sử cùng với người thực hiện và lý do bên dưới.
                  </span>
                </div>

                <div className="form-group">
                  <label>Tên cơ hội bán hàng</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Khách hàng</label>
                    <select
                      value={editForm.customer_id}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          customer_id: Number(e.target.value),
                          contact_id: undefined,
                        })
                      }
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Người liên hệ chính</label>
                    <select
                      value={editForm.contact_id || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contact_id: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    >
                      <option value="">-- Chưa gán người liên hệ --</option>
                      {contactsForEdit.map((cnt) => (
                        <option key={cnt.id} value={cnt.id}>
                          {cnt.name} {cnt.title ? `(${cnt.title})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Giai đoạn bán hàng <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={editForm.stage}
                      onChange={(e) => {
                        const newStg = e.target.value;
                        const stgObj = stages.find((s) => s.key === newStg);
                        setEditForm({
                          ...editForm,
                          stage: newStg,
                          win_probability: stgObj ? stgObj.probability : editForm.win_probability,
                        });
                      }}
                    >
                      {stages.map((stg) => (
                        <option key={stg.key} value={stg.key}>
                          {stg.label} ({stg.probability}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Giá trị dự kiến (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.value}
                      onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>
                      Ngày dự kiến chốt <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={editForm.expected_close_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, expected_close_date: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Người sở hữu / Phụ trách <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={editForm.owner_user_id || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          owner_user_id: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Xác suất thành công (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editForm.win_probability}
                      onChange={(e) =>
                        setEditForm({ ...editForm, win_probability: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Ghi chú xác suất</label>
                    <input
                      type="text"
                      placeholder="Lý do sửa tay xác suất..."
                      value={editForm.probability_note || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, probability_note: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 700, color: '#b45309' }}>
                    Lý do thay đổi (Ghi nhận vào lịch sử)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Khách hàng yêu cầu bổ sung module Báo cáo nâng cao nên tăng giá trị..."
                    value={editForm.change_reason || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, change_reason: e.target.value })
                    }
                  />
                  <div className="form-help">
                    Giúp Trưởng nhóm kinh doanh hiểu lý do điều chỉnh mà không phải hỏi lại.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu thay đổi & Ghi nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM LỊCH SỬ THAY ĐỔI CƠ HỘI (S6-01) */}
      {isHistoryModalOpen && activeHistoryOpp && (
        <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Lịch sử thay đổi cơ hội: <span>{activeHistoryOpp.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Giai đoạn hiện tại:</span>
                  <strong>{stages.find((s) => s.key === activeHistoryOpp.stage)?.label || activeHistoryOpp.stage}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Giá trị hiện tại:</span>
                  <strong style={{ color: '#16a34a' }}>
                    {new Intl.NumberFormat('vi-VN').format(activeHistoryOpp.value || activeHistoryOpp.amount || 0)} VNĐ
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Ngày dự kiến chốt:</span>
                  <strong>
                    {activeHistoryOpp.expected_close_date
                      ? new Date(activeHistoryOpp.expected_close_date).toLocaleDateString('vi-VN')
                      : '—'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Người sở hữu:</span>
                  <strong>{activeHistoryOpp.owner?.name || 'Chưa gán'}</strong>
                </div>
              </div>

              {loadingHistory ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Đang tải nhật ký thay đổi...
                </div>
              ) : histories.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Chưa có thay đổi nào được ghi nhận cho cơ hội này.
                </div>
              ) : (
                <div className="history-timeline">
                  {histories.map((h) => (
                    <div key={h.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-card">
                        <div className="timeline-header">
                          <span className="timeline-title">
                            Thay đổi <strong>{h.field_label}</strong>
                          </span>
                          <span className="timeline-time">
                            {new Date(h.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {h.field_name !== 'created' ? (
                          <div className="timeline-diff">
                            <span className="diff-old">
                              Cũ: {h.old_label || h.old_value || '—'}
                            </span>
                            <span className="diff-arrow">➜</span>
                            <span className="diff-new">
                              Mới: {h.new_label || h.new_value || '—'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: '#2563eb', marginBottom: '6px' }}>
                            🎉 Khởi tạo cơ hội thành công trên hệ thống.
                          </div>
                        )}

                        <div className="timeline-author">
                          <User size={13} />
                          Người thực hiện: <strong>{h.changed_by_user?.name || 'Hệ thống'}</strong>
                        </div>

                        {h.reason && (
                          <div className="timeline-reason">
                            📝 Lý do: {h.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityManagementPage;

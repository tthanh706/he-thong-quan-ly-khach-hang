import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Globe,
  Plus,
  Code,
  Play,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle,
  Copy,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';
import { webFormService } from '../services/webFormService';
import type { WebForm, CreateWebFormData, PublicLeadSubmitPayload } from '../types/webForm';
import './WebFormPage.css';

export const WebFormPage: React.FC = () => {
  const [forms, setForms] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal tạo / sửa
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingForm, setEditingForm] = useState<WebForm | null>(null);
  const [formData, setFormData] = useState<CreateWebFormData>({
    name: '',
    source: 'Website Landing Page',
    title: '',
    description: '',
    submit_button_text: 'Gửi thông tin',
    success_message: 'Cảm ơn bạn đã đăng ký! Đội ngũ tư vấn sẽ liên hệ lại sớm nhất.',
    rate_limit_per_minute: 5,
    is_active: true,
  });

  // Modal mã nhúng
  const [embedModalForm, setEmbedModalForm] = useState<WebForm | null>(null);
  const [embedActiveTab, setEmbedActiveTab] = useState<'iframe' | 'html'>('iframe');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Modal test gửi lead
  const [testModalForm, setTestModalForm] = useState<WebForm | null>(null);
  const [testPayload, setTestPayload] = useState<PublicLeadSubmitPayload>({
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@example.com',
    phone: '0988123456',
    company: 'Công ty Công nghệ Alpha',
    interest_demand: 'Cần tư vấn giải pháp CRM quản lý khách hàng doanh nghiệp B2B',
    _hp_website: '',
  });
  const [simulateSpamBot, setSimulateSpamBot] = useState<boolean>(false);
  const [testSubmitting, setTestSubmitting] = useState<boolean>(false);
  const [testResponse, setTestResponse] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Modal xem Leads của Form
  const [viewLeadsForm, setViewLeadsForm] = useState<WebForm | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await webFormService.getForms({
        search: searchTerm,
        is_active: statusFilter,
      });
      setForms(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách biểu mẫu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingForm(null);
    setFormData({
      name: '',
      source: 'Website Landing Page',
      title: '',
      description: 'Vui lòng điền thông tin bên dưới để chuyên viên liên hệ tư vấn miễn phí.',
      submit_button_text: 'Gửi thông tin tư vấn',
      success_message: 'Cảm ơn bạn! Đội ngũ kinh doanh đã tiếp nhận và sẽ liên hệ ngay.',
      rate_limit_per_minute: 5,
      is_active: true,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (form: WebForm) => {
    setEditingForm(form);
    setFormData({
      name: form.name,
      source: form.source,
      title: form.title || '',
      description: form.description || '',
      submit_button_text: form.submit_button_text || 'Gửi thông tin',
      success_message: form.success_message || '',
      rate_limit_per_minute: form.rate_limit_per_minute || 5,
      is_active: form.is_active,
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên biểu mẫu');
      return;
    }

    try {
      if (editingForm) {
        await webFormService.updateForm(editingForm.id, formData);
        toast.success('Cập nhật biểu mẫu thành công!');
      } else {
        await webFormService.createForm(formData);
        toast.success('Tạo biểu mẫu web mới thành công!');
      }
      setIsFormModalOpen(false);
      fetchForms();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu biểu mẫu');
    }
  };

  const handleDeleteForm = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa biểu mẫu "${name}"?`)) return;
    try {
      await webFormService.deleteForm(id);
      toast.success('Đã xóa biểu mẫu');
      fetchForms();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa biểu mẫu');
    }
  };

  const handleOpenEmbedModal = async (form: WebForm) => {
    try {
      const detail = await webFormService.getFormDetail(form.id);
      setEmbedModalForm(detail);
      setEmbedActiveTab('iframe');
    } catch (err: any) {
      toast.error('Không thể lấy mã nhúng');
    }
  };

  const handleCopyCode = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('Đã sao chép mã nhúng vào Clipboard!');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleOpenTestModal = (form: WebForm) => {
    setTestModalForm(form);
    setTestResponse(null);
    setSimulateSpamBot(false);
    setTestPayload({
      name: 'Nguyễn Văn Minh',
      email: `minh.test_${Math.floor(Math.random() * 1000)}@congty.vn`,
      phone: '0988123456',
      company: 'Tập đoàn Đầu tư Sáng Tạo',
      interest_demand: 'Muốn tìm hiểu giải pháp CRM Lead & Pipeline cho phòng kinh doanh',
      _hp_website: '',
    });
  };

  const handleExecuteTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalForm) return;

    setTestSubmitting(true);
    setTestResponse(null);

    const payload = { ...testPayload };
    if (simulateSpamBot) {
      payload._hp_website = 'http://spam-bot-automated-link.xyz';
    } else {
      payload._hp_website = '';
    }

    try {
      const res = await webFormService.testSubmit(testModalForm.embed_token, payload);
      setTestResponse({
        success: true,
        message: res.message,
        data: res.data,
      });
      toast.success('Lead đã vào hệ thống thành công (Trạng thái: Mới)!');
      fetchForms();
    } catch (err: any) {
      setTestResponse({
        success: false,
        message: err.message || 'Gửi thất bại',
      });
      toast.error(err.message || 'Gửi thất bại');
    } finally {
      setTestSubmitting(false);
    }
  };

  const handleOpenViewLeads = async (form: WebForm) => {
    try {
      const detail = await webFormService.getFormDetail(form.id);
      setViewLeadsForm(detail);
    } catch (err: any) {
      toast.error('Không thể lấy danh sách lead của form');
    }
  };

  // Tính toán stats
  const totalForms = forms.length;
  const activeForms = forms.filter((f) => f.is_active).length;
  const totalSubmissions = forms.reduce((acc, f) => acc + (f.leads_count ?? f.submission_count ?? 0), 0);

  return (
    <div className="webform-container">
      {/* Header */}
      <div className="webform-header">
        <div className="webform-title-group">
          <h1>
            <Globe className="text-blue-600" size={26} />
            Biểu Mẫu Nhúng Website & Thu Thập Lead
          </h1>
          <p>
            Tạo mã nhúng (iframe/HTML), dán vào bất kỳ website nào để thu thập Lead tự động vào hệ thống CRM với tính năng chống spam honeypot và rate limit theo IP.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          Tạo biểu mẫu mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="webform-stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Globe size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng biểu mẫu</span>
            <span className="stat-val">{totalForms}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Đang hoạt động</span>
            <span className="stat-val">{activeForms}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Tổng Lead thu thập</span>
            <span className="stat-val">{totalSubmissions}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Chống spam Honeypot</span>
            <span className="stat-val">100% Bật</span>
          </div>
        </div>
      </div>

      {/* Actions & Filters Bar */}
      <div className="webform-actions-bar">
        <div className="search-filter-box">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo tên biểu mẫu, mã hoặc nguồn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* Forms Table */}
      <div className="webform-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Đang tải danh sách biểu mẫu...
          </div>
        ) : forms.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Chưa có biểu mẫu nào. Nhấp vào <strong>"Tạo biểu mẫu mới"</strong> để bắt đầu sinh mã nhúng!
          </div>
        ) : (
          <table className="webform-table">
            <thead>
              <tr>
                <th>Mã & Tên biểu mẫu</th>
                <th>Nguồn gắn cho Lead</th>
                <th>Số Lead đã gửi</th>
                <th>Giới hạn IP</th>
                <th>Trạng thái</th>
                <th>Người tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{form.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Mã: <code>{form.code}</code> • Token: {form.embed_token.slice(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <span className="badge-source">{form.source || 'Website'}</span>
                  </td>
                  <td>
                    <button
                      className="btn-action-icon"
                      onClick={() => handleOpenViewLeads(form)}
                      title="Xem danh sách Lead từ form này"
                    >
                      <Users size={14} />
                      <strong>{form.leads_count ?? form.submission_count ?? 0} Leads</strong>
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: '#475569' }}>
                      {form.rate_limit_per_minute || 5} lượt/phút
                    </span>
                  </td>
                  <td>
                    {form.is_active ? (
                      <span className="badge-status-active">Hoạt động</span>
                    ) : (
                      <span className="badge-status-inactive">Tạm dừng</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {form.creator?.name || 'Hệ thống'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-action-icon primary"
                        onClick={() => handleOpenEmbedModal(form)}
                        title="Lấy mã nhúng HTML & iframe dán vào website"
                      >
                        <Code size={14} />
                        Mã nhúng
                      </button>
                      <button
                        className="btn-action-icon"
                        onClick={() => handleOpenTestModal(form)}
                        title="Xem thử và test gửi Lead thực tế"
                      >
                        <Play size={14} />
                        Test gửi
                      </button>
                      <button
                        className="btn-action-icon"
                        onClick={() => handleOpenEdit(form)}
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn-action-icon danger"
                        onClick={() => handleDeleteForm(form.id, form.name)}
                        title="Xóa biểu mẫu"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: TẠO / SỬA FORM */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingForm ? 'Chỉnh sửa biểu mẫu web' : 'Tạo mới biểu mẫu thu thập Lead'}</h3>
              <button className="modal-close-btn" onClick={() => setIsFormModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên biểu mẫu <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Form Đăng ký Dùng thử CRM 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <div className="form-help">Tên gọi nội bộ để quản lý trong CRM.</div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Nguồn Lead gắn khi gửi thành công</label>
                    <input
                      type="text"
                      placeholder="Website Landing Page, Blog Tech..."
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    />
                    <div className="form-help">Đáp ứng tiêu chí: Gắn đúng nguồn của biểu mẫu.</div>
                  </div>

                  <div className="form-group">
                    <label>Giới hạn tần suất IP (lượt/phút)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formData.rate_limit_per_minute}
                      onChange={(e) =>
                        setFormData({ ...formData, rate_limit_per_minute: Number(e.target.value) })
                      }
                    />
                    <div className="form-help">Chống spam: Chặn IP gửi quá tần suất.</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Tiêu đề hiển thị trên website</label>
                  <input
                    type="text"
                    placeholder="Đăng ký nhận báo giá & giải pháp CRM"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Mô tả / Lời kêu gọi hành động (Call To Action)</label>
                  <textarea
                    rows={2}
                    placeholder="Chuyên viên tư vấn sẽ liên hệ lại với bạn trong 15 phút..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Chữ hiển thị trên nút gửi</label>
                    <input
                      type="text"
                      placeholder="Gửi thông tin"
                      value={formData.submit_button_text}
                      onChange={(e) =>
                        setFormData({ ...formData, submit_button_text: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Trạng thái hoạt động</label>
                    <select
                      value={String(formData.is_active)}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.value === 'true' })
                      }
                    >
                      <option value="true">Đang hoạt động (Nhận Lead)</option>
                      <option value="false">Tạm dừng (Khóa biểu mẫu)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Thông báo sau khi gửi thành công</label>
                  <input
                    type="text"
                    placeholder="Cảm ơn bạn! Yêu cầu của bạn đã được ghi nhận."
                    value={formData.success_message}
                    onChange={(e) =>
                      setFormData({ ...formData, success_message: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingForm ? 'Cập nhật biểu mẫu' : 'Tạo và sinh mã nhúng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM MÃ NHÚNG CHO WEBSITE */}
      {embedModalForm && (
        <div className="modal-overlay" onClick={() => setEmbedModalForm(null)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Mã nhúng cho website: <span>{embedModalForm.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setEmbedModalForm(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '14px' }}>
                Sao chép một trong hai định dạng mã dưới đây và dán vào vị trí bạn muốn hiển thị biểu mẫu trên website bất kỳ (WordPress, Wix, landing page HTML...).
              </p>

              <div className="tabs-header">
                <button
                  className={`tab-btn ${embedActiveTab === 'iframe' ? 'active' : ''}`}
                  onClick={() => setEmbedActiveTab('iframe')}
                >
                  1. Mã iframe (Khuyên dùng - Cực dễ nhúng)
                </button>
                <button
                  className={`tab-btn ${embedActiveTab === 'html' ? 'active' : ''}`}
                  onClick={() => setEmbedActiveTab('html')}
                >
                  2. Mã HTML & JavaScript Snippet (Tùy biến CSS)
                </button>
              </div>

              {embedActiveTab === 'iframe' && (
                <div>
                  <div className="code-box-wrapper">
                    <button
                      className="btn-copy-code"
                      onClick={() =>
                        handleCopyCode(
                          embedModalForm.embed_snippets?.iframe_code || '',
                          'iframe'
                        )
                      }
                    >
                      <Copy size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {copiedType === 'iframe' ? 'Đã sao chép!' : 'Sao chép iframe'}
                    </button>
                    <pre style={{ margin: 0 }}>
                      <code>{embedModalForm.embed_snippets?.iframe_code}</code>
                    </pre>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '13px', color: '#64748b' }}>
                    💡 <em>Thẻ iframe hoạt động độc lập, không bị ảnh hưởng bởi CSS của trang web chính và đã tích hợp giao diện responsive.</em>
                  </div>
                </div>
              )}

              {embedActiveTab === 'html' && (
                <div>
                  <div className="code-box-wrapper">
                    <button
                      className="btn-copy-code"
                      onClick={() =>
                        handleCopyCode(
                          embedModalForm.embed_snippets?.html_snippet || '',
                          'html'
                        )
                      }
                    >
                      <Copy size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      {copiedType === 'html' ? 'Đã sao chép!' : 'Sao chép HTML'}
                    </button>
                    <pre style={{ margin: 0 }}>
                      <code>{embedModalForm.embed_snippets?.html_snippet}</code>
                    </pre>
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '13px', color: '#64748b' }}>
                    🛡️ <em>Snippet này đã có sẵn trường Honeypot <code>_hp_website</code> ẩn để chặn spam bot và tự động gọi API rate-limited của CRM.</em>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEmbedModalForm(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XEM THỬ VÀ TEST GỬI LEAD TRỰC TIẾP */}
      {testModalForm && (
        <div className="modal-overlay" onClick={() => setTestModalForm(null)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Trình giả lập & Test gửi Lead: <span>{testModalForm.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setTestModalForm(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-antispam">
                <ShieldCheck size={18} />
                <span>
                  <strong>Cơ chế bảo vệ chủ động:</strong> Biểu mẫu kiểm tra trường ẩn Honeypot và giới hạn tần suất gửi tối đa <strong>{testModalForm.rate_limit_per_minute || 5} lượt/phút</strong> cho mỗi địa chỉ IP.
                </span>
              </div>

              <div className="test-form-preview">
                <h4 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>
                  {testModalForm.title || testModalForm.name}
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                  {testModalForm.description || 'Vui lòng để lại thông tin để chuyên viên liên hệ.'}
                </p>

                <form onSubmit={handleExecuteTestSubmit}>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        required
                        value={testPayload.name}
                        onChange={(e) =>
                          setTestPayload({ ...testPayload, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Email liên hệ <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="email"
                        required
                        value={testPayload.email}
                        onChange={(e) =>
                          setTestPayload({ ...testPayload, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Số điện thoại <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="tel"
                        required
                        value={testPayload.phone}
                        onChange={(e) =>
                          setTestPayload({ ...testPayload, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Tên công ty / Doanh nghiệp</label>
                      <input
                        type="text"
                        value={testPayload.company || ''}
                        onChange={(e) =>
                          setTestPayload({ ...testPayload, company: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nhu cầu quan tâm</label>
                    <textarea
                      rows={2}
                      value={testPayload.interest_demand || ''}
                      onChange={(e) =>
                        setTestPayload({ ...testPayload, interest_demand: e.target.value })
                      }
                    />
                  </div>

                  {/* Anti-spam Test Controller */}
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#9f1239',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={simulateSpamBot}
                        onChange={(e) => setSimulateSpamBot(e.target.checked)}
                      />
                      🤖 Giả lập Spam Bot (Cố tình điền vào ô Honeypot ẩn)
                    </label>
                    <div style={{ fontSize: '12px', color: '#be123c', marginTop: '4px', marginLeft: '24px' }}>
                      Khi tích chọn, hệ thống CRM sẽ kích hoạt bẫy Honeypot và từ chối tạo lead để ngăn chặn bot rác.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={testSubmitting}
                  >
                    {testSubmitting
                      ? 'Đang gửi...'
                      : testModalForm.submit_button_text || 'Gửi thông tin đăng ký'}
                  </button>
                </form>

                {/* Kết quả phản hồi trực tiếp */}
                {testResponse && (
                  <div
                    className={`response-box ${
                      testResponse.success ? 'success' : 'error'
                    }`}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {testResponse.success ? '✅ Thành công!' : '❌ Bị từ chối:'}
                    </div>
                    <div>{testResponse.message}</div>
                    {testResponse.data && (
                      <div
                        style={{
                          fontSize: '12px',
                          marginTop: '8px',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: '4px',
                        }}
                      >
                        Lead ID: <strong>#{testResponse.data.lead_id}</strong> • Trạng thái: <strong>Mới (waiting_assignment)</strong> • Nguồn: <strong>{testModalForm.source}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setTestModalForm(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XEM LEADS THU THẬP TỪ FORM */}
      {viewLeadsForm && (
        <div className="modal-overlay" onClick={() => setViewLeadsForm(null)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Danh sách Lead từ form: <span>{viewLeadsForm.name}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setViewLeadsForm(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {(!viewLeadsForm.recent_leads || viewLeadsForm.recent_leads.length === 0) ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Chưa có Lead nào gửi từ biểu mẫu này. Hãy thử bấm <strong>"Test gửi"</strong> để tạo lead đầu tiên!
                </div>
              ) : (
                <table className="webform-table">
                  <thead>
                    <tr>
                      <th>Họ và tên</th>
                      <th>Email & Số ĐT</th>
                      <th>Công ty</th>
                      <th>Nhu cầu</th>
                      <th>Trạng thái</th>
                      <th>Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewLeadsForm.recent_leads.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{l.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>IP: {l.ip_address || '127.0.0.1'}</div>
                        </td>
                        <td>
                          <div>{l.email}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{l.phone}</div>
                        </td>
                        <td>{l.company || '—'}</td>
                        <td style={{ maxWidth: '200px' }}>
                          <span style={{ fontSize: '12px', color: '#334155' }}>
                            {l.interest_demand || '—'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#fef3c7',
                              color: '#b45309',
                            }}
                          >
                            Mới ({l.status})
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(l.created_at).toLocaleString('vi-VN')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewLeadsForm(null)}
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

export default WebFormPage;

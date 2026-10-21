import React, { useState } from 'react';
import { leadService } from '../../services/leadService';
import type { Lead } from '../../types/lead';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
}

export const CreateLeadModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Sự kiện / Hội thảo',
    industry: 'Công nghệ thông tin',
    company_size: 'Vừa (50 - 200 người)',
    interest: 'Phần mềm CRM & ERP',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vui lòng nhập họ tên lead.');
      return;
    }
    if (!formData.source.trim()) {
      setError('Mọi lead nhập vào đều bắt buộc có nguồn.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await leadService.createManual(formData);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '90%', maxWidth: '620px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Tạo Lead Thủ Công</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Thêm mới Lead từ Sự kiện / Danh thiếp</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Họ và tên *</label>
              <input
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: Nguyễn Văn An"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Số điện thoại</label>
              <input
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: 0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
              <input
                type="email"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: an.nguyen@congty.vn"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Tên doanh nghiệp / Công ty</label>
              <input
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: Công ty TNHH Giải Pháp Số"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Nguồn Lead (Bắt buộc) *</label>
              <select
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Sự kiện / Hội thảo">Sự kiện / Hội thảo</option>
                <option value="Danh thiếp trực tiếp">Danh thiếp trực tiếp</option>
                <option value="Giới thiệu từ đối tác">Giới thiệu từ đối tác</option>
                <option value="Telesales / Outbound">Telesales / Outbound</option>
                <option value="Website / Biểu mẫu">Website / Biểu mẫu</option>
                <option value="Khác">Nguồn khác</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Ngành nghề (Dùng chấm điểm)</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                <option value="Tài chính - Ngân hàng">Tài chính - Ngân hàng</option>
                <option value="Sản xuất & Chế biến">Sản xuất & Chế biến</option>
                <option value="Bán lẻ & Thương mại">Bán lẻ & Thương mại</option>
                <option value="Bất động sản">Bất động sản</option>
                <option value="Y tế & Dược phẩm">Y tế & Dược phẩm</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Quy mô doanh nghiệp</label>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
              >
                <option value="Doanh nghiệp lớn (200+ người)">Doanh nghiệp lớn (200+ người)</option>
                <option value="Vừa (50 - 200 người)">Vừa (50 - 200 người)</option>
                <option value="Nhỏ (10 - 50 người)">Nhỏ (10 - 50 người)</option>
                <option value="Siêu nhỏ (&lt; 10 người)">Siêu nhỏ (&lt; 10 người)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Nhu cầu quan tâm</label>
              <input
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: Triển khai CRM bán hàng Q4"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Ghi chú sự kiện / danh thiếp</label>
            <textarea
              rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              placeholder="VD: Khách ghé gian hàng A12 tại Diễn đàn Chuyển đổi số, hẹn gọi lại sau 2 ngày..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Đang lưu & Tính điểm...' : 'Tạo Lead & Tự động Phân bổ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

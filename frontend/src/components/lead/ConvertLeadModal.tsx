import React, { useState } from 'react';
import { leadService } from '../../services/leadService';
import type { Lead } from '../../types/lead';
import { UserCheck, Building, User, Target } from 'lucide-react';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const ConvertLeadModal: React.FC<Props> = ({ lead, onClose, onSuccess }) => {
  if (!lead) return null;

  const [formData, setFormData] = useState({
    customer_name: lead.company || lead.name,
    tax_code: '',
    address: '',
    opportunity_name: `Cơ hội tư vấn - ${lead.company || lead.name}`,
    opportunity_value: 50000000,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    contact_title: 'Đại diện liên hệ',
    contact_department: 'Kinh doanh / Quản trị',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await leadService.convertLead(lead.id, formData);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể chuyển đổi lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '90%', maxWidth: '650px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Chuyển đổi Lead 1 Thao tác</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Chuyển Lead thành Khách hàng, Liên hệ & Cơ hội</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 16px 0' }}>
          Dữ liệu từ Lead <strong>{lead.name}</strong> sẽ được kế thừa tự động sang 3 đối tượng, toàn bộ hoạt động trao đổi sẽ được giữ lại.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. KHÁCH HÀNG DOANH NGHIỆP */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
              <Building size={16} color="#2563eb" /> 1. Khách hàng doanh nghiệp
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Tên Khách hàng / Công ty *</label>
                <input
                  required
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Mã số thuế</label>
                <input
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  placeholder="0101234567"
                  value={formData.tax_code}
                  onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 2. NGƯỜI LIÊN HỆ */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
              <User size={16} color="#7c3aed" /> 2. Người liên hệ chính ({lead.name})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Chức vụ</label>
                <input
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.contact_title}
                  onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Phòng ban</label>
                <input
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.contact_department}
                  onChange={(e) => setFormData({ ...formData, contact_department: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 3. CƠ HỘI BÁN HÀNG */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '10px' }}>
              <Target size={16} color="#16a34a" /> 3. Cơ hội bán hàng ban đầu
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Tên Cơ hội *</label>
                <input
                  required
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={formData.opportunity_name}
                  onChange={(e) => setFormData({ ...formData, opportunity_name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Giá trị dự kiến (VNĐ)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={formData.opportunity_value}
                    onChange={(e) => setFormData({ ...formData, opportunity_value: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Ngày dự kiến chốt</label>
                  <input
                    type="date"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 22px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <UserCheck size={16} />
              {loading ? 'Đang chuyển đổi...' : 'Xác nhận Chuyển đổi ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

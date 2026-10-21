import React, { useState } from 'react';
import { leadService } from '../../services/leadService';
import type { Lead } from '../../types/lead';
import { Search, GitMerge, AlertTriangle, Building, UserCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLead?: Lead | null;
}

export const DuplicateMergeModal: React.FC<Props> = ({ open, onClose, onSuccess, initialLead }) => {
  const [searchField, setSearchField] = useState({
    email: initialLead?.email || '',
    phone: initialLead?.phone || '',
    company: initialLead?.company || '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    lead_duplicates: any[];
    customer_duplicates: any[];
    has_duplicate: boolean;
  } | null>(null);

  const [primaryLeadId, setPrimaryLeadId] = useState<number | null>(initialLead?.id || null);
  const [secondaryLeadId, setSecondaryLeadId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchField.email && !searchField.phone && !searchField.company) {
      setError('Vui lòng nhập ít nhất một thông tin: Email, Số điện thoại hoặc Tên công ty để quét trùng.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await leadService.checkDuplicates({
        email: searchField.email || undefined,
        phone: searchField.phone || undefined,
        company: searchField.company || undefined,
      });
      setResults(res.data);
      if (!res.data.has_duplicate) {
        setMessage('Không phát hiện bản ghi trùng lặp nào theo tiêu chí tìm kiếm.');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi quét trùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!primaryLeadId || !secondaryLeadId) {
      setError('Vui lòng chọn 1 Lead chính (giữ lại) và 1 Lead phụ (sẽ gộp vào).');
      return;
    }
    if (primaryLeadId === secondaryLeadId) {
      setError('Lead chính và Lead phụ phải là hai bản ghi khác nhau.');
      return;
    }

    setMerging(true);
    setError('');
    try {
      const res = await leadService.mergeLeads(primaryLeadId, secondaryLeadId);
      setMessage(res.message);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Gộp lead thất bại.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Cảnh báo & Gộp Lead Trùng</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Phát hiện trùng lặp & Bảo toàn toàn bộ lịch sử</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
        {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{message}</div>}

        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email</label>
            <input
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              placeholder="VD: email@example.com"
              value={searchField.email}
              onChange={(e) => setSearchField({ ...searchField, email: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Số điện thoại</label>
            <input
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              placeholder="VD: 0912345678"
              value={searchField.phone}
              onChange={(e) => setSearchField({ ...searchField, phone: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Tên công ty</label>
            <input
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              placeholder="VD: Công ty CP ABC"
              value={searchField.company}
              onChange={(e) => setSearchField({ ...searchField, company: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
          >
            <Search size={15} /> {loading ? 'Đang quét...' : 'Quét trùng'}
          </button>
        </form>

        {results && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Gợi ý khách hàng đã tồn tại (S4-04) */}
            {results.customer_duplicates.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                  <Building size={16} /> Gợi ý: Đã phát hiện Khách hàng doanh nghiệp trùng khớp trong hệ thống
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  {results.customer_duplicates.map((cust) => (
                    <div key={cust.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                      <div>
                        <strong>{cust.name}</strong> (Mã: {cust.code || `#${cust.id}`}) — SĐT: {cust.phone || '—'} — Email: {cust.email || '—'}
                      </div>
                      <span style={{ color: '#047857', fontWeight: 600 }}>Đã là Khách hàng chính thức</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danh sách Lead trùng lặp */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Danh sách Lead trùng lặp phát hiện ({results.lead_duplicates.length})
              </h3>
              {results.lead_duplicates.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Không có Lead nào trùng.</div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Lead chính (Giữ)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Lead phụ (Gộp)</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tên Lead</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>SĐT / Email</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Công ty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.lead_duplicates.map((l) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                            <input
                              type="radio"
                              name="primaryLead"
                              checked={primaryLeadId === l.id}
                              onChange={() => setPrimaryLeadId(l.id)}
                            />
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                            <input
                              type="radio"
                              name="secondaryLead"
                              checked={secondaryLeadId === l.id}
                              onChange={() => setSecondaryLeadId(l.id)}
                            />
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                            {l.name} <span style={{ color: '#64748b', fontSize: '11px' }}>(#{l.id})</span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div>{l.phone || '—'}</div>
                            <div style={{ color: '#64748b', fontSize: '11px' }}>{l.email || '—'}</div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>{l.company || '—'}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={merging || !primaryLeadId || !secondaryLeadId || primaryLeadId === secondaryLeadId}
            onClick={handleMerge}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#7c3aed',
              color: '#fff',
              fontWeight: 600,
              cursor: merging || !primaryLeadId || !secondaryLeadId || primaryLeadId === secondaryLeadId ? 'not-allowed' : 'pointer',
            }}
          >
            <GitMerge size={16} />
            {merging ? 'Đang gộp...' : 'Gộp 2 Lead (Giữ nguyên lịch sử)'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { leadService } from '../../services/leadService';
import type { LeadScoringRule } from '../../types/lead';
import { Plus, Trash2, Award, Flame, Sun, Snowflake } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ScoringRulesModal: React.FC<Props> = ({ open, onClose }) => {
  const [rules, setRules] = useState<LeadScoringRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState({
    criterion_type: 'industry',
    criterion_value: '',
    points: 20,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      void loadRules();
    }
  }, [open]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await leadService.getScoringRules();
      setRules(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải tiêu chí chấm điểm.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.criterion_value.trim()) {
      setError('Vui lòng nhập giá trị tiêu chí (VD: Công nghệ thông tin, Doanh nghiệp lớn...).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await leadService.saveScoringRule(newRule);
      setMessage('Thêm tiêu chí thành công! Điểm các lead sẽ tự động tính lại.');
      setNewRule({ ...newRule, criterion_value: '', points: 20 });
      await loadRules();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Thêm tiêu chí thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) return;
    try {
      await leadService.deleteScoringRule(id);
      await loadRules();
    } catch (err: any) {
      setError(err?.message || 'Xóa tiêu chí thất bại.');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Cấu hình Chấm Điểm & Phân Loại Lead</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Thiết lập Tiêu chí Điểm số & Ngưỡng Nóng / Ấm / Lạnh</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
        {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{message}</div>}

        {/* BẢNG QUY ƯỚC NGƯỠNG PHÂN LOẠI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={24} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '13px' }}>Nóng (Hot Lead)</div>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>≥ 70 điểm (Ưu tiên gọi ngay)</div>
            </div>
          </div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sun size={24} color="#d97706" />
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>Ấm (Warm Lead)</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>40 - 69 điểm (Tiềm năng cao)</div>
            </div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Snowflake size={24} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '13px' }}>Lạnh (Cold Lead)</div>
              <div style={{ fontSize: '12px', color: '#1d4ed8' }}>&lt; 40 điểm (Nuôi dưỡng thêm)</div>
            </div>
          </div>
        </div>

        {/* THÊM TIÊU CHÍ MỚI */}
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Loại tiêu chí</label>
            <select
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.criterion_type}
              onChange={(e) => setNewRule({ ...newRule, criterion_type: e.target.value })}
            >
              <option value="industry">Ngành nghề</option>
              <option value="company_size">Quy mô DN</option>
              <option value="source">Nguồn Lead</option>
              <option value="interest">Mức quan tâm</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Giá trị khớp *</label>
            <input
              required
              placeholder="VD: Công nghệ thông tin, Doanh nghiệp lớn..."
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.criterion_value}
              onChange={(e) => setNewRule({ ...newRule, criterion_value: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Điểm cộng (+)</label>
            <input
              type="number"
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.points}
              onChange={(e) => setNewRule({ ...newRule, points: Number(e.target.value) })}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={14} /> Thêm tiêu chí
          </button>
        </form>

        {/* DANH SÁCH TIÊU CHÍ */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Loại tiêu chí</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Giá trị nhận diện</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Điểm số</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const typeLabels: Record<string, string> = {
                  industry: 'Ngành nghề',
                  company_size: 'Quy mô công ty',
                  source: 'Nguồn Lead',
                  interest: 'Nhu cầu quan tâm',
                };
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{typeLabels[r.criterion_type] || r.criterion_type}</td>
                    <td style={{ padding: '8px 12px' }}>{r.criterion_value}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>+{r.points} điểm</span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                        Đang áp dụng
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => void handleDelete(r.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Xóa tiêu chí"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rules.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Chưa khai báo tiêu chí nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

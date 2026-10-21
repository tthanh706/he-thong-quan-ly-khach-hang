import React, { useEffect, useState } from 'react';
import { leadService } from '../../services/leadService';
import type { LeadAssignmentRule } from '../../types/lead';
import { Plus, Trash2, GitPullRequest, ArrowDown } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AssignmentRulesModal: React.FC<Props> = ({ open, onClose }) => {
  const [rules, setRules] = useState<LeadAssignmentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    priority: 1,
    rule_type: 'region',
    condition_field: 'city',
    condition_value: 'Hà Nội',
    target_user_id: 1,
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
      const res = await leadService.getAssignmentRules();
      setRules(res.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải quy tắc phân bổ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.rule_name.trim()) {
      setError('Vui lòng nhập tên quy tắc phân bổ.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await leadService.saveAssignmentRule(newRule);
      setMessage('Thêm quy tắc phân bổ thành công!');
      setNewRule({
        rule_name: '',
        priority: rules.length + 1,
        rule_type: 'region',
        condition_field: 'city',
        condition_value: '',
        target_user_id: 1,
      });
      await loadRules();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Thêm quy tắc thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quy tắc này?')) return;
    try {
      await leadService.deleteAssignmentRule(id);
      await loadRules();
    } catch (err: any) {
      setError(err?.message || 'Xóa quy tắc thất bại.');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Cấu hình Phân Bổ Lead Tự Động</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Quy tắc Thứ tự Ưu tiên (Region / Industry / Round-Robin)</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
        {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{message}</div>}

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#1e40af', marginBottom: '14px' }}>
          💡 <strong>Cơ chế tự động:</strong> Quy tắc đầu tiên khớp điều kiện sẽ thắng và giao lead ngay. Lead không khớp quy tắc nào sẽ tự động đưa vào <em>Hàng chờ phân công (waiting_assignment)</em> để Trưởng nhóm phân tay.
        </div>

        {/* THÊM QUY TẮC MỚI */}
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 140px 1fr auto', gap: '10px', alignItems: 'end', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Ưu tiên</label>
            <input
              type="number"
              min={1}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.priority}
              onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Tên quy tắc *</label>
            <input
              required
              placeholder="VD: Phân bổ Lead CNTT cho Chuyên gia IT"
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.rule_name}
              onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Loại phân bổ</label>
            <select
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.rule_type}
              onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
            >
              <option value="region">Theo khu vực / tỉnh</option>
              <option value="industry">Theo ngành nghề</option>
              <option value="round_robin">Xoay vòng đều nhóm</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Giá trị khớp</label>
            <input
              placeholder="VD: Hà Nội hoặc CNTT"
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
              value={newRule.condition_value}
              onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={14} /> Thêm quy tắc
          </button>
        </form>

        {/* DANH SÁCH QUY TẮC */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '60px' }}>Ưu tiên</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tên quy tắc</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Phương thức</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Điều kiện khớp</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Hành động phân bổ</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                    #{r.priority}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.rule_name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', fontSize: '11px' }}>
                      {r.rule_type === 'region' ? '🗺️ Khu vực' : r.rule_type === 'industry' ? '🏭 Ngành nghề' : '🔄 Xoay vòng'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>{r.condition_value || 'Tất cả trong nhóm'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {r.target_user ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>Gán: {r.target_user.name}</span>
                    ) : (
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>Chia đều nhân viên sales</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => void handleDelete(r.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Xóa quy tắc"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Chưa thiết lập quy tắc tự động nào.
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

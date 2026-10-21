import React, { useState } from 'react';
import { salesOpportunityService } from '../../services/salesOpportunityService';
import type { SalesOpportunity, OpportunityOwner } from '../../types/salesOpportunity';
import { Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  opportunities: SalesOpportunity[];
  users: OpportunityOwner[];
  onSuccess: () => void;
}

export const BulkReassignModal: React.FC<Props> = ({ open, onClose, opportunities, users, onSuccess }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newOwnerId, setNewOwnerId] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('Điều chuyển khối lượng công việc / Nhân sự bàn giao');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === opportunities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(opportunities.map((o) => o.id));
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 cơ hội để điều chuyển.');
      return;
    }
    if (!newOwnerId) {
      toast.error('Vui lòng chọn người nhận mới.');
      return;
    }
    if (!reason.trim()) {
      toast.error('Mỗi lần chuyển cơ hội bắt buộc phải nhập lý do.');
      return;
    }

    setLoading(true);
    try {
      const res = await salesOpportunityService.bulkReassign({
        opportunity_ids: selectedIds,
        new_owner_id: Number(newOwnerId),
        reason: reason.trim(),
      });
      toast.success(res.message || 'Điều chuyển quyền sở hữu thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Điều chuyển thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '90%', maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Điều Chuyển Quyền Sở Hữu Hàng Loạt</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Bàn Giao & Phân Bổ Lại Cơ Hội Bán Hàng</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        <form onSubmit={handleReassign} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Người nhận mới (Chủ sở hữu mới) *
              </label>
              <select
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn nhân viên kinh doanh nhận cơ hội --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Lý do điều chuyển *
              </label>
              <input
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                placeholder="VD: Nhân viên nghỉ phép dài ngày / Quá tải thương vụ"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              Chọn các cơ hội cần chuyển ({selectedIds.length} đã chọn):
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              {selectedIds.length === opportunities.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '8px 12px', width: '40px', textAlign: 'center' }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tên cơ hội</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Khách hàng</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Giá trị</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Người sở hữu hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() => toggleSelect(opp.id)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: selectedIds.includes(opp.id) ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(opp.id)}
                        onChange={() => toggleSelect(opp.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{opp.name}</td>
                    <td style={{ padding: '8px 12px' }}>{opp.customer?.name}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                      {Number(opp.value || opp.amount || 0).toLocaleString('vi')} đ
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{opp.owner?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || selectedIds.length === 0 || !newOwnerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: loading || selectedIds.length === 0 || !newOwnerId ? 'not-allowed' : 'pointer',
              }}
            >
              <UserCheck size={16} />
              {loading ? 'Đang điều chuyển...' : `Xác nhận chuyển ${selectedIds.length} cơ hội`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

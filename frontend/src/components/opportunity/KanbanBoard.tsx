import React, { useEffect, useState } from 'react';
import { salesOpportunityService } from '../../services/salesOpportunityService';
import type { SalesOpportunity } from '../../types/salesOpportunity';
import { Building, DollarSign, Calendar, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onSelectOpportunity: (opp: SalesOpportunity) => void;
  currentUser?: any;
}

interface ColumnData {
  stage: string;
  stage_name: string;
  color: string;
  probability: number;
  count: number;
  total_value: number;
  opportunities: SalesOpportunity[];
}

export const KanbanBoard: React.FC<Props> = ({ onSelectOpportunity, currentUser }) => {
  const [columns, setColumns] = useState<Record<string, ColumnData>>({});
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stage gate failure modal
  const [gateModal, setGateModal] = useState<{
    open: boolean;
    opportunity: SalesOpportunity | null;
    targetStage: string;
    targetStageName: string;
    missingConditions: string[];
    overrideReason: string;
  }>({
    open: false,
    opportunity: null,
    targetStage: '',
    targetStageName: '',
    missingConditions: [],
    overrideReason: '',
  });

  const isLeader = currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.role === 'TEAM_LEADER' || currentUser?.role === 'SALES_DIRECTOR';

  const loadKanban = async () => {
    setLoading(true);
    try {
      const res = await salesOpportunityService.getKanban();
      setColumns(res.columns);
      setTotalOpportunities(res.total_opportunities);
      setTotalPipelineValue(res.total_pipeline_value);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải bảng Kanban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadKanban();
  }, []);

  const handleMoveStage = async (opp: SalesOpportunity, newStage: string, override = false, reason = '') => {
    if (opp.stage === newStage) return;

    try {
      const res = await salesOpportunityService.changeStage(opp.id, {
        stage: newStage,
        override_stage_gates: override,
        override_reason: reason || undefined,
      });

      if ((res as any).stage_gate_failed) {
        const stageObj = columns[newStage];
        setGateModal({
          open: true,
          opportunity: opp,
          targetStage: newStage,
          targetStageName: stageObj?.stage_name || newStage,
          missingConditions: (res as any).missing_conditions || [res.message],
          overrideReason: '',
        });
        return;
      }

      toast.success(res.message || 'Chuyển giai đoạn thành công!');
      setGateModal((prev) => ({ ...prev, open: false }));
      await loadKanban();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể chuyển giai đoạn');
    }
  };

  const handleConfirmOverride = async () => {
    if (!gateModal.opportunity) return;
    if (!gateModal.overrideReason.trim()) {
      toast.error('Trưởng nhóm ghi đè bắt buộc phải nhập lý do.');
      return;
    }

    await handleMoveStage(gateModal.opportunity, gateModal.targetStage, true, gateModal.overrideReason);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu Pipeline Kanban...</div>;
  }

  const columnKeys = Object.keys(columns);

  return (
    <div className="kanban-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* TỔNG QUAN PIPELINE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Tổng thương vụ: </span>
            <strong style={{ color: '#0f172a' }}>{totalOpportunities} cơ hội</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Tổng giá trị Pipeline: </span>
            <strong style={{ color: '#16a34a', fontSize: '14px' }}>
              {Number(totalPipelineValue).toLocaleString('vi-VN')} đ
            </strong>
          </div>
        </div>
        <button
          onClick={() => void loadKanban()}
          style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', cursor: 'pointer', fontSize: '12px' }}
        >
          Làm mới bảng
        </button>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnKeys.length || 6}, minmax(280px, 1fr))`, gap: '14px', overflowX: 'auto', paddingBottom: '16px' }}>
        {columnKeys.map((key) => {
          const col = columns[key];
          return (
            <div
              key={key}
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '600px',
              }}
            >
              {/* Header Cột */}
              <div
                style={{
                  padding: '12px 14px',
                  borderTop: `4px solid ${col.color || '#2563eb'}`,
                  borderBottom: '1px solid #e2e8f0',
                  background: '#fff',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{col.stage_name}</span>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>
                    {col.probability}% thắng
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>{col.count} cơ hội</span>
                  <strong style={{ color: '#047857' }}>{Number(col.total_value).toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>

              {/* Danh sách Thẻ Cơ Hội */}
              <div style={{ padding: '10px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.opportunities.map((opp) => {
                  const isStagnant = (opp as any).is_stagnant || opp.status === 'open' && (new Date(opp.expected_close_date).getTime() < Date.now());

                  return (
                    <div
                      key={opp.id}
                      onClick={() => onSelectOpportunity(opp)}
                      style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '12px',
                        border: isStagnant ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Cảnh báo đình trệ S5-02 & S5-07 */}
                      {isStagnant && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginBottom: '6px' }}>
                          <AlertTriangle size={11} /> Cảnh báo đình trệ / Quá hạn
                        </div>
                      )}

                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                        {opp.name}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontSize: '12px', marginBottom: '4px' }}>
                        <Building size={12} color="#64748b" /> {opp.customer?.name || 'Khách hàng #' + opp.customer_id}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '13px' }}>
                          {Number(opp.value || opp.amount || 0).toLocaleString('vi-VN')} đ
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} /> {opp.expected_close_date ? new Date(opp.expected_close_date).toLocaleDateString('vi') : '—'}
                        </span>
                      </div>

                      {/* Dropdown chuyển giai đoạn nhanh */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: '8px', paddingTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Chuyển:</span>
                        <select
                          value={opp.stage}
                          onChange={(e) => void handleMoveStage(opp, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '11px',
                            background: '#f8fafc',
                          }}
                        >
                          {columnKeys.map((cKey) => (
                            <option key={cKey} value={cKey}>
                              {columns[cKey]?.stage_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {col.opportunities.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '12px' }}>
                    Không có thương vụ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CẢNH BÁO ĐIỀU KIỆN CHƯA THOẢ (STAGE GATE - S5-04) */}
      {gateModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '90%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '14px' }}>
              <ShieldAlert size={28} />
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Điều kiện chuyển giai đoạn chưa thỏa mãn</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Chuyển sang: {gateModal.targetStageName}</span>
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#991b1b', marginBottom: '6px' }}>
                Thương vụ còn thiếu các điều kiện bắt buộc sau:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#b91c1c' }}>
                {gateModal.missingConditions.map((cond, i) => (
                  <li key={i}>{cond}</li>
                ))}
              </ul>
            </div>

            {isLeader ? (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', marginBottom: '4px' }}>
                  ⭐ Quyền Trưởng nhóm / Giám đốc: Ghi đè điều kiện
                </div>
                <textarea
                  rows={2}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  placeholder="Bắt buộc nhập lý do đặc biệt để phê duyệt ghi đè..."
                  value={gateModal.overrideReason}
                  onChange={(e) => setGateModal({ ...gateModal, overrideReason: e.target.value })}
                />
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>
                Vui lòng hoàn thành các hoạt động hoặc sản phẩm được yêu cầu trước khi chuyển giai đoạn, hoặc nhờ Trưởng nhóm ghi đè kèm lý do.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setGateModal({ ...gateModal, open: false })}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}
              >
                Hủy bỏ
              </button>
              {isLeader && (
                <button
                  type="button"
                  onClick={handleConfirmOverride}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  Xác nhận Ghi đè & Chuyển
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

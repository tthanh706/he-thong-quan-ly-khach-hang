import type { Lead } from '../../types/lead';
import { Flame, Sun, Snowflake, UserCheck } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  currentUserId: number;
  loading: boolean;
  busyLeadId: number | null;
  onAccept: (lead: Lead) => void;
  onReject: (lead: Lead) => void;
  onContact: (lead: Lead) => void;
  onHistory: (lead: Lead) => void;
  onConvert?: (lead: Lead) => void;
}

const statusLabels: Record<string, string> = {
  new: 'Mới (Web/Import)',
  waiting_assignment: 'Chờ phân công',
  assigned: 'Đã phân công',
  caring: 'Đang chăm sóc',
  contacted: 'Đã liên hệ',
  converted: 'Đã chuyển đổi',
  merged: 'Đã gộp',
  rejected: 'Đã từ chối',
};

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function slaText(lead: Lead): string {
  if (lead.converted_at || lead.status === 'converted') {
    return 'Đã hoàn tất';
  }

  if (lead.contacted_at) {
    return 'Đã liên hệ';
  }

  if (!lead.sla_deadline) {
    return 'Chưa áp dụng';
  }

  if (lead.sla_flagged_at || lead.is_sla_overdue) {
    return 'Quá hạn';
  }

  const diff = new Date(lead.sla_deadline).getTime() - Date.now();
  if (diff <= 0) {
    return 'Quá hạn';
  }

  const minutes = Math.ceil(diff / 60000);
  return `Còn ${minutes} phút`;
}

function RatingBadge({ rating, score }: { rating?: string; score?: number }) {
  if (rating === 'hot' || (score && score >= 70)) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
        <Flame size={12} /> Nóng ({score ?? 0}đ)
      </span>
    );
  }
  if (rating === 'warm' || (score && score >= 40)) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
        <Sun size={12} /> Ấm ({score ?? 0}đ)
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
      <Snowflake size={12} /> Lạnh ({score ?? 0}đ)
    </span>
  );
}

export function LeadTable({
  leads,
  currentUserId,
  loading,
  busyLeadId,
  onAccept,
  onReject,
  onContact,
  onHistory,
  onConvert,
}: LeadTableProps) {
  if (loading) {
    return <div className="empty-state table-empty">Đang tải danh sách lead...</div>;
  }

  if (leads.length === 0) {
    return <div className="empty-state table-empty">Không có lead phù hợp bộ lọc.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Khách hàng / Công ty</th>
            <th>Liên hệ</th>
            <th>Nguồn & Điểm số</th>
            <th>Trạng thái</th>
            <th>Nhân viên</th>
            <th>SLA</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const assignedToMe = lead.assigned_to === currentUserId;
            const isBusy = busyLeadId === lead.id;
            const isConverted = lead.status === 'converted' || !!lead.converted_at;
            const isMerged = lead.status === 'merged' || !!lead.is_merged;

            return (
              <tr key={lead.id} className={lead.is_sla_overdue || lead.sla_flagged_at ? 'row-overdue' : ''}>
                <td>
                  <strong>{lead.name}</strong>
                  {lead.company && <div style={{ fontSize: '12px', color: '#334155' }}>🏢 {lead.company}</div>}
                  <span className="cell-subtext">Lead #{lead.id} {lead.campaign ? `• CD: ${lead.campaign.name}` : ''}</span>
                </td>
                <td>
                  <span>{lead.phone ?? '—'}</span>
                  <span className="cell-subtext">{lead.email ?? '—'}</span>
                </td>
                <td>
                  <span style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginBottom: '4px' }}>
                    {lead.source || 'Trực tiếp'}
                  </span>
                  <div>
                    <RatingBadge rating={lead.rating} score={lead.score} />
                  </div>
                </td>
                <td>
                  <span className={`status status-${lead.status}`}>
                    {statusLabels[lead.status] || lead.status}
                  </span>
                  {lead.rejection_reason && (
                    <span className="cell-subtext rejection-note">Từ chối: {lead.rejection_reason}</span>
                  )}
                  {isConverted && lead.convertedCustomer && (
                    <span className="cell-subtext" style={{ color: '#16a34a', fontWeight: 600 }}>
                      → {lead.convertedCustomer.name}
                    </span>
                  )}
                </td>
                <td>
                  {lead.assigned_user?.name ?? (lead.assigned_to ? `User #${lead.assigned_to}` : 'Chưa phân công')}
                  <span className="cell-subtext">
                    {lead.team_leader?.name ? `TL: ${lead.team_leader.name}` : ''}
                  </span>
                </td>
                <td>
                  <span className={lead.is_sla_overdue || lead.sla_flagged_at ? 'sla-overdue' : 'sla-normal'}>
                    {slaText(lead)}
                  </span>
                  <span className="cell-subtext">{formatDate(lead.sla_deadline)}</span>
                </td>
                <td>
                  <div className="action-group">
                    {!isConverted && !isMerged && (
                      <>
                        {lead.status === 'assigned' && assignedToMe && (
                          <>
                            <button className="button button-primary button-small" type="button" disabled={isBusy} onClick={() => onAccept(lead)}>
                              Nhận lead
                            </button>
                            <button className="button button-danger-outline button-small" type="button" disabled={isBusy} onClick={() => onReject(lead)}>
                              Từ chối
                            </button>
                          </>
                        )}
                        {lead.status === 'caring' && assignedToMe && !lead.contacted_at && (
                          <button className="button button-success button-small" type="button" disabled={isBusy} onClick={() => onContact(lead)}>
                            Đã liên hệ
                          </button>
                        )}
                        {onConvert && (lead.status === 'caring' || lead.status === 'contacted' || assignedToMe) && (
                          <button
                            className="button button-primary button-small"
                            type="button"
                            title="Chuyển đổi thành Khách hàng & Cơ hội"
                            style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}
                            disabled={isBusy}
                            onClick={() => onConvert(lead)}
                          >
                            <UserCheck size={13} /> Chuyển đổi
                          </button>
                        )}
                      </>
                    )}
                    <button className="button button-ghost button-small" type="button" onClick={() => onHistory(lead)}>
                      Lịch sử
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

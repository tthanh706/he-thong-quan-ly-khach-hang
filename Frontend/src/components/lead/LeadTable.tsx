import type { Lead, LeadStatus } from '../../types/lead';

interface LeadTableProps {
  leads: Lead[];
  currentUserId: number;
  loading: boolean;
  busyLeadId: number | null;
  onAccept: (lead: Lead) => void;
  onReject: (lead: Lead) => void;
  onContact: (lead: Lead) => void;
  onHistory: (lead: Lead) => void;
}

const statusLabels: Record<LeadStatus, string> = {
  waiting_assignment: 'Chờ phân công',
  assigned: 'Đã phân công',
  caring: 'Đang chăm sóc',
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

export function LeadTable({
  leads,
  currentUserId,
  loading,
  busyLeadId,
  onAccept,
  onReject,
  onContact,
  onHistory,
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
            <th>Khách hàng</th>
            <th>Liên hệ</th>
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
            return (
              <tr key={lead.id} className={lead.is_sla_overdue || lead.sla_flagged_at ? 'row-overdue' : ''}>
                <td>
                  <strong>{lead.name}</strong>
                  <span className="cell-subtext">Lead #{lead.id}</span>
                </td>
                <td>
                  <span>{lead.phone ?? '—'}</span>
                  <span className="cell-subtext">{lead.email ?? '—'}</span>
                </td>
                <td>
                  <span className={`status status-${lead.status}`}>{statusLabels[lead.status]}</span>
                  {lead.rejection_reason && (
                    <span className="cell-subtext rejection-note">Từ chối: {lead.rejection_reason}</span>
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

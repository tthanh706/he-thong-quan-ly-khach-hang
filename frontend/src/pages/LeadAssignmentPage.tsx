import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { LeadHistoryModal } from '../components/lead/LeadHistoryModal';
import { LeadTable } from '../components/lead/LeadTable';
import { RejectLeadModal } from '../components/lead/RejectLeadModal';
import { SlaAlertPanel } from '../components/lead/SlaAlertPanel';
import { leadService } from '../services/leadService';
import { useAuth } from '../hooks/useAuth';
import type {
  CurrentUser,
  Lead,
  LeadHistory,
  LeadStatus,
  SlaAlert,
} from '../types/lead';
import './LeadAssignmentPage.css';

interface LeadAssignmentPageProps {
  currentUser?: CurrentUser;
  onLogout?: () => Promise<void>;
}

function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError || caught instanceof Error) {
    return caught.message;
  }
  return 'Đã xảy ra lỗi không xác định.';
}

export function LeadAssignmentPage({ currentUser: propUser, onLogout }: LeadAssignmentPageProps) {
  const { user: authUser, logout: authLogout } = useAuth();
  const currentUser: CurrentUser = (propUser || authUser || {
    id: 1,
    name: 'Nhân viên',
    email: 'user@example.com',
    role: 'staff',
  }) as CurrentUser;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [alerts, setAlerts] = useState<SlaAlert[]>([]);
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(true);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectLead, setRejectLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isLeader = currentUser.role === 'team_leader' || currentUser.role === 'admin' || currentUser.role === 'TEAM_LEADER';

  const loadLeads = useCallback(async (): Promise<void> => {
    setLoadingLeads(true);
    setError('');

    try {
      const response = await leadService.getLeads({
        status,
        assigned_to: onlyMine ? currentUser.id : undefined,
        sla_overdue: onlyOverdue ? true : undefined,
        search,
        per_page: 100,
      });
      setLeads(response.data ?? []);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingLeads(false);
    }
  }, [currentUser.id, onlyMine, onlyOverdue, search, status]);

  const loadAlerts = useCallback(async (): Promise<void> => {
    if (!isLeader) {
      setAlerts([]);
      return;
    }

    setLoadingAlerts(true);
    try {
      const response = await leadService.getSlaAlerts();
      setAlerts(response.data ?? []);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingAlerts(false);
    }
  }, [isLeader]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const stats = useMemo(() => {
    const assigned = leads.filter((lead) => lead.status === 'assigned').length;
    const caring = leads.filter((lead) => lead.status === 'caring').length;
    const overdue = leads.filter((lead) => lead.is_sla_overdue || lead.sla_flagged_at).length;
    return { total: leads.length, assigned, caring, overdue };
  }, [leads]);

  const finishAction = async (message: string): Promise<void> => {
    setSuccess(message);
    setError('');
    await Promise.all([loadLeads(), loadAlerts()]);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleAccept = async (lead: Lead): Promise<void> => {
    setBusyLeadId(lead.id);
    try {
      await leadService.accept(lead.id);
      await finishAction(`Đã nhận lead “${lead.name}”.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleReject = async (reason: string): Promise<void> => {
    if (!rejectLead) {
      return;
    }

    setBusyLeadId(rejectLead.id);
    try {
      await leadService.reject(rejectLead.id, reason);
      const leadName = rejectLead.name;
      setRejectLead(null);
      await finishAction(`Đã từ chối lead “${leadName}” và đưa về hàng chờ phân công.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleContact = async (lead: Lead): Promise<void> => {
    setBusyLeadId(lead.id);
    try {
      await leadService.markContacted(lead.id);
      await finishAction(`Đã ghi nhận liên hệ với “${lead.name}”.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleHistory = async (lead: Lead): Promise<void> => {
    setHistoryLead(lead);
    setLoadingHistory(true);
    setHistory([]);
    try {
      const response = await leadService.getHistory(lead.id);
      setHistory(response.data ?? []);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCheckSla = async (): Promise<void> => {
    setError('');
    try {
      await leadService.checkSla();
      await finishAction('Đã chạy kiểm tra SLA.');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const doLogout = async () => {
    if (onLogout) await onLogout();
    else await authLogout();
  };

  return (
    <div className="lead-assignment-page" style={{ padding: '24px' }}>
      <section className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px', margin: 0 }}>S4-07 · CRM ENTERPRISE</p>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Tiếp nhận & từ chối Lead</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Quản lý lead được phân công và theo dõi thời hạn liên hệ SLA.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => void handleCheckSla()} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Kiểm tra SLA
        </button>
      </section>

      {error && <div className="notice notice-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div className="notice notice-success" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <section className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <article className="stat-card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng lead</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.total}</strong>
        </article>
        <article className="stat-card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Chờ nhận</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.assigned}</strong>
        </article>
        <article className="stat-card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Đang chăm sóc</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.caring}</strong>
        </article>
        <article className="stat-card stat-card-danger" style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
          <span style={{ color: '#ef4444', fontSize: '13px' }}>Quá SLA</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#dc2626' }}>{stats.overdue}</strong>
        </article>
      </section>

      {isLeader && (
        <SlaAlertPanel alerts={alerts} loading={loadingAlerts} onRefresh={() => void loadAlerts()} />
      )}

      <section className="panel" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
        <div className="panel-heading panel-heading-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Lead được phân công</h2>
          </div>
          <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="input filter-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, email, số điện thoại..."
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="waiting_assignment">Chờ phân công</option>
              <option value="assigned">Đã phân công</option>
              <option value="caring">Đang chăm sóc</option>
            </select>
            <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />
              Lead của tôi
            </label>
            <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyOverdue} onChange={(event) => setOnlyOverdue(event.target.checked)} />
              Chỉ quá SLA
            </label>
            <button className="button button-secondary button-small" type="button" onClick={() => void loadLeads()} style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              Làm mới
            </button>
          </div>
        </div>

        <LeadTable
          leads={leads}
          currentUserId={currentUser.id}
          loading={loadingLeads}
          busyLeadId={busyLeadId}
          onAccept={(lead) => void handleAccept(lead)}
          onReject={setRejectLead}
          onContact={(lead) => void handleContact(lead)}
          onHistory={(lead) => void handleHistory(lead)}
        />
      </section>

      <RejectLeadModal
        lead={rejectLead}
        submitting={busyLeadId === rejectLead?.id}
        onClose={() => setRejectLead(null)}
        onSubmit={handleReject}
      />

      <LeadHistoryModal
        lead={historyLead}
        history={history}
        loading={loadingHistory}
        onClose={() => setHistoryLead(null)}
      />
    </div>
  );
}

export default LeadAssignmentPage;

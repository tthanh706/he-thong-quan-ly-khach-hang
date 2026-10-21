import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { LeadHistoryModal } from '../components/lead/LeadHistoryModal';
import { LeadTable } from '../components/lead/LeadTable';
import { RejectLeadModal } from '../components/lead/RejectLeadModal';
import { SlaAlertPanel } from '../components/lead/SlaAlertPanel';
import { leadService } from '../services/leadService';
import type {
  CurrentUser,
  Lead,
  LeadHistory,
  LeadStatus,
  SlaAlert,
} from '../types/lead';

interface LeadAssignmentPageProps {
  currentUser: CurrentUser;
  onLogout: () => Promise<void>;
}

function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError || caught instanceof Error) {
    return caught.message;
  }
  return 'Đã xảy ra lỗi không xác định.';
}

export function LeadAssignmentPage({ currentUser, onLogout }: LeadAssignmentPageProps) {
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

  const isLeader = currentUser.role === 'team_leader';

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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark brand-mark-small">CRM</div>
          <div>
            <strong>Hệ thống quản lý khách hàng</strong>
            <span>Lead & SLA</span>
          </div>
        </div>
        <div className="user-area">
          <div className="user-meta">
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role === 'team_leader' ? 'Trưởng nhóm' : 'Nhân viên'}</span>
          </div>
          <button className="button button-secondary button-small" type="button" onClick={() => void onLogout()}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="content-wrap">
        <section className="page-heading">
          <div>
            <p className="eyebrow">S4-07</p>
            <h1>Tiếp nhận & từ chối Lead</h1>
            <p>Quản lý lead được phân công và theo dõi thời hạn liên hệ SLA.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => void handleCheckSla()}>
            Kiểm tra SLA
          </button>
        </section>

        {error && <div className="notice notice-error">{error}</div>}
        {success && <div className="notice notice-success">{success}</div>}

        <section className="stat-grid">
          <article className="stat-card">
            <span>Tổng lead</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>Chờ nhận</span>
            <strong>{stats.assigned}</strong>
          </article>
          <article className="stat-card">
            <span>Đang chăm sóc</span>
            <strong>{stats.caring}</strong>
          </article>
          <article className="stat-card stat-card-danger">
            <span>Quá SLA</span>
            <strong>{stats.overdue}</strong>
          </article>
        </section>

        {isLeader && (
          <SlaAlertPanel alerts={alerts} loading={loadingAlerts} onRefresh={() => void loadAlerts()} />
        )}

        <section className="panel">
          <div className="panel-heading panel-heading-wrap">
            <div>
              <p className="eyebrow">DANH SÁCH</p>
              <h2>Lead được phân công</h2>
            </div>
            <div className="filters">
              <input
                className="input filter-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, email, số điện thoại..."
              />
              <select className="select" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')}>
                <option value="">Tất cả trạng thái</option>
                <option value="waiting_assignment">Chờ phân công</option>
                <option value="assigned">Đã phân công</option>
                <option value="caring">Đang chăm sóc</option>
              </select>
              <label className="checkbox-row">
                <input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />
                Lead của tôi
              </label>
              <label className="checkbox-row">
                <input type="checkbox" checked={onlyOverdue} onChange={(event) => setOnlyOverdue(event.target.checked)} />
                Chỉ quá SLA
              </label>
              <button className="button button-secondary button-small" type="button" onClick={() => void loadLeads()}>
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
      </div>

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
    </main>
  );
}

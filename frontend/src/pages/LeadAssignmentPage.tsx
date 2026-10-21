import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { LeadHistoryModal } from '../components/lead/LeadHistoryModal';
import { LeadTable } from '../components/lead/LeadTable';
import { RejectLeadModal } from '../components/lead/RejectLeadModal';
import { SlaAlertPanel } from '../components/lead/SlaAlertPanel';
import { CreateLeadModal } from '../components/lead/CreateLeadModal';
import { ImportLeadModal } from '../components/lead/ImportLeadModal';
import { DuplicateMergeModal } from '../components/lead/DuplicateMergeModal';
import { ConvertLeadModal } from '../components/lead/ConvertLeadModal';
import { ScoringRulesModal } from '../components/lead/ScoringRulesModal';
import { AssignmentRulesModal } from '../components/lead/AssignmentRulesModal';
import { leadService } from '../services/leadService';
import { useAuth } from '../hooks/useAuth';
import type {
  CurrentUser,
  Lead,
  LeadHistory,
  LeadStatus,
  SlaAlert,
} from '../types/lead';
import { Plus, Upload, GitMerge, Award, Sliders, Filter, Bookmark } from 'lucide-react';
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
  const [source, setSource] = useState('');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(
    !['admin', 'manager', 'team_leader', 'TEAM_LEADER', 'SALES_DIRECTOR'].includes(String(currentUser.role)),
  );
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [activeSavedFilter, setActiveSavedFilter] = useState<string>('all');
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state (Sprint 4)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [rejectLead, setRejectLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LeadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isLeader = currentUser.role === 'team_leader' || currentUser.role === 'admin' || currentUser.role === 'TEAM_LEADER' || currentUser.role === 'SALES_DIRECTOR';

  const loadLeads = useCallback(async (): Promise<void> => {
    setLoadingLeads(true);
    setError('');

    try {
      const response = await leadService.getLeads({
        status,
        source: source || undefined,
        rating: rating || undefined,
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
  }, [currentUser.id, onlyMine, onlyOverdue, search, status, source, rating]);

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
    const assigned = leads.filter((lead) => lead.status === 'assigned' || lead.status === 'waiting_assignment' || lead.status === 'new').length;
    const caring = leads.filter((lead) => lead.status === 'caring').length;
    const overdue = leads.filter((lead) => lead.is_sla_overdue || lead.sla_flagged_at).length;
    const hotLeads = leads.filter((lead) => lead.rating === 'hot' || (lead.score && lead.score >= 70)).length;
    return { total: leads.length, assigned, caring, overdue, hotLeads };
  }, [leads]);

  const finishAction = async (message: string): Promise<void> => {
    setSuccess(message);
    setError('');
    await Promise.all([loadLeads(), loadAlerts()]);
    window.setTimeout(() => setSuccess(''), 3500);
  };

  const handleAccept = async (lead: Lead): Promise<void> => {
    setBusyLeadId(lead.id);
    try {
      await leadService.accept(lead.id);
      await finishAction(`Đã nhận lead “${lead.name}”. Chuyển sang trạng thái Đang chăm sóc.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyLeadId(null);
    }
  };

  const handleReject = async (reason: string): Promise<void> => {
    if (!rejectLead) return;

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

  // S4-09: Áp dụng các bộ lọc lưu sẵn
  const applySavedFilter = (filterKey: string) => {
    setActiveSavedFilter(filterKey);
    const isLeaderRole = ['admin', 'manager', 'team_leader', 'TEAM_LEADER', 'SALES_DIRECTOR'].includes(String(currentUser.role));
    if (filterKey === 'today_calls') {
      setStatus('caring');
      setOnlyMine(!isLeaderRole);
      setOnlyOverdue(false);
      setRating('');
      setSource('');
    } else if (filterKey === 'hot_leads') {
      setRating('hot');
      setStatus('');
      setOnlyOverdue(false);
    } else if (filterKey === 'sla_overdue') {
      setOnlyOverdue(true);
      setStatus('');
      setRating('');
    } else if (filterKey === 'events') {
      setSource('Hội thảo');
      setStatus('');
      setRating('');
      setOnlyOverdue(false);
    } else {
      setStatus('');
      setSource('');
      setRating('');
      setOnlyOverdue(false);
    }
  };

  return (
    <div className="lead-assignment-page" style={{ padding: '24px' }}>
      <section className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Quản lý & Tiếp nhận Lead</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Thu thập, chấm điểm, phân bổ tự động, chống trùng và chuyển đổi cơ hội.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="button button-primary"
            type="button"
            onClick={() => setCreateModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600 }}
          >
            <Plus size={16} /> Tạo Lead thủ công
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setImportModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Upload size={16} /> Nhập Excel
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setMergeModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <GitMerge size={16} /> Quét & Gộp trùng
          </button>
          {isLeader && (
            <>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setScoringModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Award size={16} /> Chấm điểm
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setAssignmentModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Sliders size={16} /> Quy tắc phân bổ
              </button>
            </>
          )}
          <button
            className="button button-secondary"
            type="button"
            onClick={() => void handleCheckSla()}
            style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Kiểm tra SLA
          </button>
        </div>
      </section>

      {error && <div className="notice notice-error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div className="notice notice-success" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <section className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
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
        <article className="stat-card" style={{ background: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
          <span style={{ color: '#ea580c', fontSize: '13px' }}>Lead Nóng (Hot)</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#c2410c' }}>{stats.hotLeads}</strong>
        </article>
        <article className="stat-card stat-card-danger" style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
          <span style={{ color: '#ef4444', fontSize: '13px' }}>Quá SLA phản hồi</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#dc2626' }}>{stats.overdue}</strong>
        </article>
      </section>

      {/* S4-09: BỘ LỌC LƯU SẴN (SAVED FILTERS) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Bookmark size={15} color="#2563eb" /> Bộ lọc lưu sẵn:
        </span>
        <button
          type="button"
          onClick={() => applySavedFilter('all')}
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeSavedFilter === 'all' ? '#2563eb' : '#cbd5e1', background: activeSavedFilter === 'all' ? '#eff6ff' : '#fff', color: activeSavedFilter === 'all' ? '#1d4ed8' : '#334155' }}
        >
          Tất cả Lead
        </button>
        <button
          type="button"
          onClick={() => applySavedFilter('today_calls')}
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeSavedFilter === 'today_calls' ? '#2563eb' : '#cbd5e1', background: activeSavedFilter === 'today_calls' ? '#eff6ff' : '#fff', color: activeSavedFilter === 'today_calls' ? '#1d4ed8' : '#334155' }}
        >
          📞 Cần gọi hôm nay (Đang chăm sóc)
        </button>
        <button
          type="button"
          onClick={() => applySavedFilter('hot_leads')}
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeSavedFilter === 'hot_leads' ? '#ea580c' : '#cbd5e1', background: activeSavedFilter === 'hot_leads' ? '#fff7ed' : '#fff', color: activeSavedFilter === 'hot_leads' ? '#c2410c' : '#334155' }}
        >
          🔥 Lead Nóng (≥ 70 điểm)
        </button>
        <button
          type="button"
          onClick={() => applySavedFilter('sla_overdue')}
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeSavedFilter === 'sla_overdue' ? '#dc2626' : '#cbd5e1', background: activeSavedFilter === 'sla_overdue' ? '#fef2f2' : '#fff', color: activeSavedFilter === 'sla_overdue' ? '#b91c1c' : '#334155' }}
        >
          ⚠️ Quá hạn SLA
        </button>
        <button
          type="button"
          onClick={() => applySavedFilter('events')}
          style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeSavedFilter === 'events' ? '#2563eb' : '#cbd5e1', background: activeSavedFilter === 'events' ? '#eff6ff' : '#fff', color: activeSavedFilter === 'events' ? '#1d4ed8' : '#334155' }}
        >
          🎫 Nguồn Hội thảo / Sự kiện
        </button>
      </div>

      {isLeader && (
        <SlaAlertPanel alerts={alerts} loading={loadingAlerts} onRefresh={() => void loadAlerts()} />
      )}

      <section className="panel" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
        <div className="panel-heading panel-heading-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Danh sách Lead chi tiết</h2>
          </div>
          <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="input filter-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, email, sđt, công ty..."
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | '')} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="new">Mới vào</option>
              <option value="waiting_assignment">Chờ phân công</option>
              <option value="assigned">Đã phân công</option>
              <option value="caring">Đang chăm sóc</option>
              <option value="converted">Đã chuyển đổi</option>
              <option value="merged">Đã gộp</option>
            </select>
            <select className="select" value={rating} onChange={(event) => setRating(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Tất cả phân loại</option>
              <option value="hot">🔥 Nóng</option>
              <option value="warm">☀️ Ấm</option>
              <option value="cold">❄️ Lạnh</option>
            </select>
            <select className="select" value={source} onChange={(event) => setSource(event.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Tất cả nguồn</option>
              <option value="Sự kiện / Hội thảo">Sự kiện / Hội thảo</option>
              <option value="Website / Biểu mẫu">Website / Biểu mẫu</option>
              <option value="Google Ads / SEM">Google Ads / SEM</option>
              <option value="Danh thiếp trực tiếp">Danh thiếp trực tiếp</option>
              <option value="Giới thiệu từ đối tác">Giới thiệu từ đối tác</option>
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
          onConvert={(lead) => setConvertLead(lead)}
        />
      </section>

      {/* MODALS */}
      <CreateLeadModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => void finishAction('Đã tạo Lead thành công và tính điểm theo tiêu chí.')}
      />

      <ImportLeadModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => void finishAction('Đã nhập danh sách Lead từ Excel thành công!')}
      />

      <DuplicateMergeModal
        open={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        onSuccess={() => void finishAction('Đã gộp hai bản ghi lead thành công và bảo toàn toàn bộ lịch sử.')}
      />

      <ConvertLeadModal
        lead={convertLead}
        onClose={() => setConvertLead(null)}
        onSuccess={() => void finishAction(`Đã chuyển đổi lead thành Khách hàng doanh nghiệp & Cơ hội bán hàng thành công!`)}
      />

      <ScoringRulesModal
        open={scoringModalOpen}
        onClose={() => setScoringModalOpen(false)}
      />

      <AssignmentRulesModal
        open={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
      />

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


import { useEffect, useMemo, useState } from 'react';
import ActivityModal from '../components/ActivityModal';
import AlertPanel from '../components/AlertPanel';
import FilterBar from '../components/FilterBar';
import OpportunityTable from '../components/OpportunityTable';
import StageConfigPanel from '../components/StageConfigPanel';
import StatCards from '../components/StatCards';
import {
  addActivity,
  checkStagnation,
  getAlerts,
  getOpportunities,
  getProblemOpportunities,
  getStageConfigs,
  logout,
  updateStageConfig,
} from '../services/opportunityService';
import type { Opportunity, OpportunityAlert, StageConfig, UserSummary } from '../types/opportunity';

interface Props {
  user: UserSummary;
  onLogout: () => void;
}

export default function DashboardPage({ user, onLogout }: Props) {
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [problemOpportunities, setProblemOpportunities] = useState<Opportunity[]>([]);
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [configs, setConfigs] = useState<StageConfig[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [warning, setWarning] = useState('');
  const [tab, setTab] = useState<'problems' | 'all' | 'config'>('problems');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [allRes, problemRes, alertRes, configRes] = await Promise.all([
        getOpportunities(),
        getProblemOpportunities(),
        getAlerts(),
        getStageConfigs(),
      ]);
      setAllOpportunities(allRes.data);
      setProblemOpportunities(problemRes.data);
      setAlerts(alertRes.data);
      setConfigs(configRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const source = tab === 'problems' ? problemOpportunities : allOpportunities;
  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    return source.filter((item) => {
      if (key && !item.name.toLowerCase().includes(key)) return false;
      if (stage && item.stage !== stage) return false;
      if (warning === 'stagnant' && !item.has_stagnation_warning) return false;
      if (warning === 'overdue_close' && !item.has_overdue_close_warning) return false;
      if (warning === 'both' && !(item.has_stagnation_warning && item.has_overdue_close_warning)) return false;
      return true;
    });
  }, [source, search, stage, warning]);

  const stagnantCount = problemOpportunities.filter((x) => x.has_stagnation_warning).length;
  const overdueCount = problemOpportunities.filter((x) => x.has_overdue_close_warning).length;
  const totalValue = problemOpportunities.reduce((sum, x) => sum + Number(x.value || 0), 0);

  async function handleCheck() {
    setChecking(true);
    setMessage('');
    setError('');
    try {
      const response = await checkStagnation();
      setMessage(`Đã kiểm tra: ${response.data.stagnant_count} đình trệ, ${response.data.overdue_close_count} quá ngày chốt.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kiểm tra cảnh báo thất bại.');
    } finally {
      setChecking(false);
    }
  }

  async function handleActivity(type: string, note: string) {
    if (!selectedOpportunity) return;
    await addActivity(selectedOpportunity.id, type, note);
    setMessage('Đã ghi nhận hoạt động. Cảnh báo đình trệ của cơ hội đã được làm mới.');
    await loadData();
  }

  async function handleSaveConfig(id: number, days: number, active: boolean) {
    await updateStageConfig(id, days, active);
    setMessage('Đã cập nhật cấu hình ngưỡng đình trệ.');
    const response = await getStageConfigs();
    setConfigs(response.data);
  }

  async function handleLogout() {
    try { await logout(); } finally { onLogout(); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-block"><div className="brand-mark small-mark">CRM</div><div><strong>Sales CRM</strong><span>S5-07</span></div></div>
        <nav>
          <button className={tab === 'problems' ? 'active' : ''} onClick={() => setTab('problems')}>Cơ hội có vấn đề</button>
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>Tất cả cơ hội</button>
          <button className={tab === 'config' ? 'active' : ''} onClick={() => setTab('config')}>Cấu hình cảnh báo</button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><h1>Cảnh báo cơ hội đình trệ</h1><p>Phát hiện sớm cơ hội không có hoạt động hoặc đã quá ngày dự kiến chốt.</p></div>
          <div className="user-box"><div><strong>{user.name}</strong><span>{user.role === 'team_leader' ? 'Trưởng nhóm kinh doanh' : user.role}</span></div><button onClick={handleLogout} className="secondary-button">Đăng xuất</button></div>
        </header>

        {error && <div className="error-box page-message">{error}</div>}
        {message && <div className="success-box page-message">{message}</div>}

        <StatCards total={problemOpportunities.length} stagnant={stagnantCount} overdue={overdueCount} totalValue={totalValue} />

        <div className="toolbar-card">
          <div>
            <strong>Kiểm tra cảnh báo</strong>
            <p>Quét lại toàn bộ cơ hội đang mở theo cấu hình hiện tại.</p>
          </div>
          <button className="primary-button" onClick={handleCheck} disabled={checking}>{checking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}</button>
        </div>

        {tab !== 'config' ? (
          <>
            <section className="panel">
              <div className="section-title"><div><h2>{tab === 'problems' ? 'Danh sách cơ hội có vấn đề' : 'Tất cả cơ hội'}</h2><p>{tab === 'problems' ? 'Ưu tiên các cơ hội cần trưởng nhóm can thiệp.' : 'Toàn bộ cơ hội thuộc nhóm hiện tại.'}</p></div></div>
              <FilterBar search={search} stage={stage} warning={warning} onSearchChange={setSearch} onStageChange={setStage} onWarningChange={setWarning} onRefresh={() => void loadData()} />
              {loading ? <div className="empty-state">Đang tải dữ liệu...</div> : <OpportunityTable opportunities={filtered} onActivity={setSelectedOpportunity} />}
            </section>
            <AlertPanel alerts={alerts} />
          </>
        ) : (
          <StageConfigPanel configs={configs} onSave={handleSaveConfig} />
        )}
      </main>

      {selectedOpportunity && (
        <ActivityModal opportunity={selectedOpportunity} onClose={() => setSelectedOpportunity(null)} onSubmit={handleActivity} />
      )}
    </div>
  );
}

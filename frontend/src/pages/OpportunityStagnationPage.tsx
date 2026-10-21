import { useEffect, useMemo, useState } from 'react';
import ActivityModal from '../components/opportunity/ActivityModal';
import AlertPanel from '../components/opportunity/AlertPanel';
import FilterBar from '../components/opportunity/FilterBar';
import OpportunityTable from '../components/opportunity/OpportunityTable';
import StageConfigPanel from '../components/opportunity/StageConfigPanel';
import StatCards from '../components/opportunity/StatCards';
import {
  addActivity,
  checkStagnation,
  getAlerts,
  getOpportunities,
  getProblemOpportunities,
  getStageConfigs,
  updateStageConfig,
} from '../services/opportunityService';
import { useAuth } from '../hooks/useAuth';
import type { Opportunity, OpportunityAlert, StageConfig, UserSummary } from '../types/opportunity';
import './OpportunityStagnationPage.css';

interface Props {
  user?: UserSummary;
  onLogout?: () => void;
}

export default function OpportunityStagnationPage({ user: propUser, onLogout }: Props) {
  const { user: authUser, logout: authLogout } = useAuth();
  const user: UserSummary = (propUser || authUser || {
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    role: 'team_leader',
  }) as UserSummary;

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

  return (
    <div className="opportunity-stagnation-page" style={{ padding: '24px' }}>
      <header className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Cảnh báo cơ hội đình trệ</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Phát hiện sớm cơ hội không có hoạt động hoặc đã quá ngày dự kiến chốt.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`secondary-button ${tab === 'problems' ? 'active' : ''}`}
            onClick={() => setTab('problems')}
            style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', background: tab === 'problems' ? '#2563eb' : '#fff', color: tab === 'problems' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}
          >
            Cơ hội có vấn đề
          </button>
          <button
            className={`secondary-button ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
            style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', background: tab === 'all' ? '#2563eb' : '#fff', color: tab === 'all' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}
          >
            Tất cả cơ hội
          </button>
          <button
            className={`secondary-button ${tab === 'config' ? 'active' : ''}`}
            onClick={() => setTab('config')}
            style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', background: tab === 'config' ? '#2563eb' : '#fff', color: tab === 'config' ? '#fff' : '#334155', border: '1px solid #cbd5e1' }}
          >
            Cấu hình cảnh báo
          </button>
        </div>
      </header>

      {error && <div className="error-box page-message" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {message && <div className="success-box page-message" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{message}</div>}

      <StatCards total={problemOpportunities.length} stagnant={stagnantCount} overdue={overdueCount} totalValue={totalValue} />

      <div className="toolbar-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
        <div>
          <strong>Quét & kiểm tra cảnh báo</strong>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>Quét lại toàn bộ cơ hội đang mở theo cấu hình hiện tại để phát hiện sớm cơ hội cần can thiệp.</p>
        </div>
        <button className="primary-button" onClick={handleCheck} disabled={checking} style={{ background: '#2563eb', color: '#fff', border: 0, padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}>
          {checking ? 'Đang kiểm tra...' : 'Kiểm tra ngay'}
        </button>
      </div>

      {tab !== 'config' ? (
        <>
          <section className="panel" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div className="section-title" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>{tab === 'problems' ? 'Danh sách cơ hội có vấn đề' : 'Tất cả cơ hội'}</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>{tab === 'problems' ? 'Ưu tiên các cơ hội cần trưởng nhóm can thiệp.' : 'Toàn bộ cơ hội thuộc nhóm hiện tại.'}</p>
            </div>
            <FilterBar search={search} stage={stage} warning={warning} onSearchChange={setSearch} onStageChange={setStage} onWarningChange={setWarning} onRefresh={() => void loadData()} />
            {loading ? <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang tải dữ liệu...</div> : <OpportunityTable opportunities={filtered} onActivity={setSelectedOpportunity} />}
          </section>
          <AlertPanel alerts={alerts} />
        </>
      ) : (
        <StageConfigPanel configs={configs} onSave={handleSaveConfig} />
      )}

      {selectedOpportunity && (
        <ActivityModal opportunity={selectedOpportunity} onClose={() => setSelectedOpportunity(null)} onSubmit={handleActivity} />
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { exportTeamPerformance, getTeamMembers, getTeamPerformance } from '../services/teamPerformanceService';
import { useAuth } from '../hooks/useAuth';
import type { CurrentUser, PerformanceReport, TeamMember } from '../types';
import PerformanceTable from '../components/performance/PerformanceTable';
import StatCard from '../components/performance/StatCard';
import './TeamPerformancePage.css';

function d(x: Date) {
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function week(offset = 0) {
  const n = new Date();
  const day = n.getDay();
  const start = new Date(n);
  start.setDate(n.getDate() + (day === 0 ? -6 : 1 - day) + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: d(start), end: d(end) };
}

interface Props {
  user?: CurrentUser;
  onLogout?: () => void;
}

export default function TeamPerformancePage({ user: propUser }: Props) {
  const { user: authUser } = useAuth();
  const user: CurrentUser = (propUser || authUser || {
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    role: 'team_leader',
  }) as CurrentUser;

  const w = week();
  const [from, setFrom] = useState(w.start);
  const [to, setTo] = useState(w.end);
  const [selected, setSelected] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const r = await getTeamPerformance({ dateFrom: from, dateTo: to, userId: selected });
      setReport(r.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không thể tải báo cáo.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const r = await getTeamMembers();
      setMembers(r.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không thể tải thành viên.');
    }
  }

  useEffect(() => {
    void loadMembers();
    void load();
  }, []);

  const coaching = useMemo(() => report?.members.filter((m) => m.sla_rate < 60).length ?? 0, [report]);

  async function exp() {
    setExporting(true);
    setErr('');
    setMsg('');
    try {
      await exportTeamPerformance({ dateFrom: from, dateTo: to, userId: selected });
      setMsg('Đã xuất báo cáo Excel thành công.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không thể xuất Excel.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="team-performance-page" style={{ padding: '24px' }}>
      <header className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Báo cáo hoạt động & năng suất nhóm</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Theo dõi hoạt động bán hàng và tỷ lệ phản hồi lead trong thời hạn SLA.</p>
        </div>
      </header>

      {msg && <div className="success" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{msg}</div>}
      {err && <div className="error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{err}</div>}

      <section className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div className="title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Bộ lọc báo cáo</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Chọn khoảng ngày hoặc lọc riêng theo từng thành viên kinh doanh.</p>
          </div>
          <div className="quick" style={{ display: 'flex', gap: '8px' }}>
            <button
              className="light"
              onClick={() => {
                const x = week();
                setFrom(x.start);
                setTo(x.end);
              }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '12px' }}
            >
              Tuần hiện tại
            </button>
            <button
              className="light"
              onClick={() => {
                const x = week(-1);
                setFrom(x.start);
                setTo(x.end);
              }}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '12px' }}
            >
              Tuần trước
            </button>
          </div>
        </div>

        <div className="filters" style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '16px' }}>
          <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
            Từ ngày
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </label>
          <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
            Đến ngày
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </label>
          <label style={{ display: 'grid', gap: '4px', fontSize: '13px', fontWeight: 500, minWidth: '180px' }}>
            Thành viên
            <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value ? Number(e.target.value) : null)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="">Toàn bộ nhóm</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <button onClick={load} style={{ padding: '9px 18px', borderRadius: '6px', border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            Áp dụng
          </button>
          <button
            className="excel"
            onClick={exp}
            disabled={exporting}
            style={{ padding: '9px 18px', borderRadius: '6px', border: 0, background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </section>

      <section className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatCard label="Thành viên" value={report?.summary.member_count ?? 0} />
        <StatCard
          label="Tổng hoạt động"
          value={report?.summary.total_activities ?? 0}
          note={`Gọi ${report?.summary.calls ?? 0} · Gặp ${report?.summary.meetings ?? 0} · Báo giá ${report?.summary.quotations ?? 0}`}
        />
        <StatCard
          label="Lead được giao"
          value={report?.summary.assigned_leads ?? 0}
          note={`Đúng SLA: ${report?.summary.responded_within_sla ?? 0}`}
        />
        <StatCard label="Tỷ lệ SLA toàn nhóm" value={`${(report?.summary.sla_rate ?? 0).toFixed(0)}%`} />
        <StatCard label="Cần kèm thêm" value={coaching} note="SLA dưới 60%" />
      </section>

      <section className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Thống kê theo thành viên</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
              {report ? `${report.period.date_from} → ${report.period.date_to}` : 'Đang tải...'}
            </p>
          </div>
          <div className="legend" style={{ display: 'flex', gap: '8px' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>≥ 80% Tốt</span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>60–79% Theo dõi</span>
            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>&lt; 60% Cần kèm thêm</span>
          </div>
        </div>
        <PerformanceTable rows={report?.members ?? []} loading={loading} />
      </section>
    </div>
  );
}

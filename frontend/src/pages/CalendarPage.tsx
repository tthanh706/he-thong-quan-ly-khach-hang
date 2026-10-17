import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Users } from 'lucide-react';
import CalendarBoard from '../components/calendar/CalendarBoard';
import CreateItemModal from '../components/calendar/CreateItemModal';
import { createMeeting, createTask, getCalendarUsers, getMyCalendar, getTeamCalendar } from '../services/calendarService';
import { useAuth } from '../hooks/useAuth';
import type { CalendarItem, CalendarView, MeetingPayload, TaskPayload, UserSummary } from '../types/calendar';
import './CalendarPage.css';

interface Props {
  user?: UserSummary;
  onLogout?: () => void;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function move(date: string, view: CalendarView, dir: number) {
  const d = new Date(`${date}T00:00:00`);
  if (view === 'day') d.setDate(d.getDate() + dir);
  else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return iso(d);
}

export default function CalendarPage({ user: propUser }: Props) {
  const { user: authUser } = useAuth();
  const user: UserSummary = (propUser || authUser || {
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    role: 'team_leader',
  }) as UserSummary;

  const [view, setView] = useState<CalendarView>('week');
  const [date, setDate] = useState(iso(new Date()));
  const [scope, setScope] = useState<'my' | 'team'>(
    user.role === 'team_leader' || user.role === 'admin' || user.role === 'TEAM_LEADER' ? 'team' : 'my'
  );
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [userFilter, setUserFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'meeting' | 'task' | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [calendarResult, userResult] = await Promise.all([
        scope === 'team' ? getTeamCalendar(view, date) : getMyCalendar(view, date),
        getCalendarUsers(),
      ]);
      setItems(calendarResult.data);
      setUsers(userResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [view, date, scope]);

  const stats = useMemo(
    () => ({
      total: items.length,
      meetings: items.filter((i) => i.item_type === 'meeting').length,
      tasks: items.filter((i) => i.item_type === 'task').length,
      people: new Set(items.map((i) => i.assigned_user_id).filter(Boolean)).size,
    }),
    [items]
  );

  async function addMeeting(data: MeetingPayload) {
    await createMeeting(data);
    await load();
  }

  async function addTask(data: TaskPayload) {
    await createTask(data);
    await load();
  }

  return (
    <div className="team-calendar-page" style={{ padding: '24px' }}>
      <section className="hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow" style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px', margin: 0 }}>S6-07 · CRM ENTERPRISE</p>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Lịch làm việc nhóm</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Quản lý cuộc gặp và công việc có hạn trên cùng một lịch trực quan.</p>
        </div>
        <div className="hero-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary" onClick={() => setModal('task')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #cbd5e1', background: '#fff' }}>
            <Plus size={17} /> Công việc
          </button>
          <button className="primary" onClick={() => setModal('meeting')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', border: 0, background: '#2563eb', color: '#fff' }}>
            <Plus size={17} /> Cuộc gặp
          </button>
        </div>
      </section>

      <section className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng mục</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.total}</strong>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Cuộc gặp</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.meetings}</strong>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Công việc</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.tasks}</strong>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Thành viên có lịch</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.people}</strong>
        </div>
      </section>

      <section className="toolbar" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div className="segmented" style={{ display: 'flex', borderRadius: '8px', background: '#f1f5f9', padding: '3px' }}>
          {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
            <button
              key={v}
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
              style={{ padding: '6px 14px', borderRadius: '6px', border: 0, cursor: 'pointer', background: view === v ? '#fff' : 'transparent', fontWeight: view === v ? 600 : 400, boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>

        <div className="date-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setDate(move(date, view, -1))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button onClick={() => setDate(move(date, view, 1))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {(user.role === 'team_leader' || user.role === 'admin' || user.role === 'TEAM_LEADER') && (
          <div className="segmented" style={{ display: 'flex', borderRadius: '8px', background: '#f1f5f9', padding: '3px' }}>
            <button
              className={scope === 'my' ? 'active' : ''}
              onClick={() => setScope('my')}
              style={{ padding: '6px 14px', borderRadius: '6px', border: 0, cursor: 'pointer', background: scope === 'my' ? '#fff' : 'transparent', fontWeight: scope === 'my' ? 600 : 400 }}
            >
              Lịch của tôi
            </button>
            <button
              className={scope === 'team' ? 'active' : ''}
              onClick={() => setScope('team')}
              style={{ padding: '6px 14px', borderRadius: '6px', border: 0, cursor: 'pointer', background: scope === 'team' ? '#fff' : 'transparent', fontWeight: scope === 'team' ? 600 : 400, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Users size={15} /> Lịch nhóm
            </button>
          </div>
        )}

        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="all">Tất cả nhân viên</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <button className="icon-button" onClick={() => void load()} title="Làm mới" style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
          <RefreshCw size={18} />
        </button>
      </section>

      {error && <div className="error-box" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {loading ? (
        <div className="loading" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang tải lịch...</div>
      ) : (
        <CalendarBoard items={items} view={view} date={date} userFilter={userFilter} />
      )}

      {modal && (
        <CreateItemModal
          type={modal}
          users={users.length ? users : [user]}
          currentUser={user}
          onClose={() => setModal(null)}
          onMeeting={addMeeting}
          onTask={addTask}
        />
      )}
    </div>
  );
}

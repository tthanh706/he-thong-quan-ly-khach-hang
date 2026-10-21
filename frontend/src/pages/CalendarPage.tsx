import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Users, AlertTriangle, Bell, CheckCircle2, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import CalendarBoard from '../components/calendar/CalendarBoard';
import CreateItemModal from '../components/calendar/CreateItemModal';
import { createMeeting, createTask, getCalendarUsers, getMyCalendar, getTeamCalendar } from '../services/calendarService';
import { activityTimelineService } from '../services/activityTimelineService';
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

  // S6-09: Task Reminders & Overdue state
  const [reminders, setReminders] = useState<{
    total_overdue: number;
    total_upcoming: number;
    overdue_tasks: any[];
    upcoming_tasks: any[];
    team_overdue_summary?: any[];
  } | null>(null);

  // S6-06: Task Detail & Actions (Complete / Postpone)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [isPostponing, setIsPostponing] = useState(false);
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState('');

  async function loadReminders() {
    try {
      const res = await activityTimelineService.getTaskReminders();
      if (res.success && res.data) {
        setReminders(res.data as any);
      }
    } catch {
      // ignore
    }
  }

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
    void loadReminders();
  }, [view, date, scope]);

  async function handleCompleteTask(id: number) {
    try {
      await activityTimelineService.completeTask(id);
      toast.success('Đã đánh dấu hoàn thành công việc!');
      setSelectedItem(null);
      await Promise.all([load(), loadReminders()]);
    } catch (err: any) {
      toast.error(err.message || 'Không thể hoàn thành công việc');
    }
  }

  async function handlePostponeTask(id: number) {
    if (!postponeReason.trim()) {
      toast.error('Bắt buộc nhập lý do hoãn công việc');
      return;
    }
    if (!postponeDate) {
      toast.error('Vui lòng chọn hạn hoàn thành mới');
      return;
    }
    try {
      await activityTimelineService.postponeTask(id, {
        new_due_at: postponeDate,
        postpone_reason: postponeReason,
      });
      toast.success('Đã hoãn công việc thành công!');
      setSelectedItem(null);
      setIsPostponing(false);
      setPostponeReason('');
      setPostponeDate('');
      await Promise.all([load(), loadReminders()]);
    } catch (err: any) {
      toast.error(err.message || 'Không thể hoãn công việc');
    }
  }

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

      {/* S6-09: Cảnh báo việc quá hạn & nhắc việc sắp đến hạn */}
      {reminders && (reminders.total_overdue > 0 || reminders.total_upcoming > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {reminders.total_overdue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 18px', color: '#991b1b', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <div>
                  <strong>CẢNH BÁO QUÁ HẠN:</strong> Có <strong>{reminders.total_overdue}</strong> công việc đã quá hạn hoàn thành cần xử lý ngay!
                </div>
              </div>
              {reminders.team_overdue_summary && reminders.team_overdue_summary.length > 0 && (
                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Theo nhân viên:</span>
                  {reminders.team_overdue_summary.map((t: any) => (
                    <span key={t.user_id} style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {t.name}: {t.overdue_count} việc
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {reminders.total_upcoming > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 18px', color: '#92400e', fontSize: '13px' }}>
              <Bell size={18} color="#d97706" />
              <span>
                <strong>NHẮC VIỆC TRONG 24 GIỜ:</strong> Có <strong>{reminders.total_upcoming}</strong> công việc sắp đến hạn cần theo dõi và hoàn tất.
              </span>
            </div>
          )}
        </div>
      )}

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
        <CalendarBoard
          items={items}
          view={view}
          date={date}
          userFilter={userFilter}
          onSelectItem={(item) => {
            setSelectedItem(item);
            setIsPostponing(false);
            setPostponeReason('');
            setPostponeDate('');
          }}
        />
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

      {/* S6-06: Task Detail / Complete / Postpone Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: selectedItem.item_type === 'meeting' ? '#eff6ff' : '#ecfdf5', color: selectedItem.item_type === 'meeting' ? '#2563eb' : '#059669', textTransform: 'uppercase' }}>
                  {selectedItem.item_type === 'meeting' ? 'Cuộc gặp' : 'Công việc (Task)'}
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Chi tiết lịch làm việc</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ border: 0, background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                  {selectedItem.title}
                </h4>
                {selectedItem.description && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                    {selectedItem.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Thời gian / Hạn:</span>
                  <strong>{selectedItem.item_type === 'meeting' ? `${selectedItem.start_at} - ${selectedItem.end_at}` : (selectedItem.due_at || '—')}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Người thực hiện:</span>
                  <strong>{selectedItem.assigned_user?.name || 'Chưa gán'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Mức độ ưu tiên:</span>
                  <span style={{ fontWeight: 700, color: selectedItem.priority === 'high' ? '#dc2626' : selectedItem.priority === 'medium' ? '#d97706' : '#2563eb' }}>
                    {selectedItem.priority === 'high' ? 'Khẩn cấp' : selectedItem.priority === 'medium' ? 'Trung bình' : 'Bình thường'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Trạng thái:</span>
                  <strong>{selectedItem.status === 'completed' ? '✓ Đã hoàn thành' : selectedItem.status === 'postponed' ? '⏳ Đã hoãn' : 'Đang xử lý'}</strong>
                </div>
              </div>

              {selectedItem.postpone_reason && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
                  <strong>Lý do hoãn trước đó:</strong> {selectedItem.postpone_reason}
                </div>
              )}

              {/* S6-06: Hoãn công việc form */}
              {isPostponing && (
                <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                    ⏳ Hoãn công việc sang thời điểm mới
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Hạn hoàn thành mới *
                    </label>
                    <input
                      type="datetime-local"
                      value={postponeDate}
                      onChange={(e) => setPostponeDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Lý do hoãn (bắt buộc) *
                    </label>
                    <textarea
                      placeholder="Nhập lý do hoãn việc (ví dụ: Chờ khách hàng phản hồi thêm yêu cầu...)"
                      value={postponeReason}
                      onChange={(e) => setPostponeReason(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsPostponing(false)}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePostponeTask(selectedItem.id)}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: 0, background: '#d97706', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Xác nhận hoãn việc
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedItem.item_type === 'task' && selectedItem.status !== 'completed' && !isPostponing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPostponing(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #d97706', background: '#fffbeb', color: '#b45309', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Clock size={16} /> Hoãn việc kèm lý do
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCompleteTask(selectedItem.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 0, background: '#059669', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <CheckCircle2 size={16} /> Đánh dấu hoàn thành
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

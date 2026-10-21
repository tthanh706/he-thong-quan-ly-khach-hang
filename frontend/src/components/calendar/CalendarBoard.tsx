import type { CalendarItem, CalendarView } from '../../types/calendar';

function dt(v:string|null){ return v ? new Date(v.replace(' ','T')) : null; }
function dayKey(d:Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function time(v:string|null){ const d=dt(v); return d?d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):''; }
function label(item:CalendarItem){ return item.item_type==='meeting' ? `${time(item.start_at)}–${time(item.end_at)}` : `Hạn ${time(item.due_at)}`; }

interface Props {
  items: CalendarItem[];
  view: CalendarView;
  date: string;
  userFilter: number | 'all';
  onSelectItem?: (item: CalendarItem) => void;
}

export default function CalendarBoard({ items, view, date, userFilter, onSelectItem }: Props) {
  const filtered = userFilter === 'all' ? items : items.filter((i) => i.assigned_user_id === userFilter);
  const anchor = new Date(`${date}T00:00:00`);
  const days: Date[] = [];
  if (view === 'day') days.push(anchor);
  if (view === 'week') {
    const start = new Date(anchor);
    const diff = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
  }
  if (view === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first);
    const diff = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - diff);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
  }

  return (
    <div className={`calendar-board ${view}`}>
      {days.map((d) => {
        const key = dayKey(d);
        const dayItems = filtered.filter(
          (i) => dayKey(dt(i.item_type === 'meeting' ? i.start_at : i.due_at) ?? new Date(0)) === key
        );
        return (
          <section className="day-cell" key={key}>
            <header>
              <strong>
                {d.toLocaleDateString('vi-VN', {
                  weekday: view === 'month' ? undefined : 'short',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </strong>
              {view === 'month' && <span>{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>}
            </header>
            <div className="day-items">
              {dayItems.length === 0 ? (
                <div className="empty-slot">Trống</div>
              ) : (
                dayItems.map((item) => (
                  <article
                    className={`calendar-item ${item.item_type}`}
                    key={item.id}
                    onClick={() => onSelectItem?.(item)}
                    style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                    title="Nhấp để xem chi tiết / hoàn thành / hoãn việc"
                  >
                    <div className="item-top">
                      <span className="badge">{item.item_type === 'meeting' ? 'Cuộc gặp' : 'Công việc'}</span>
                      <span>{label(item)}</span>
                    </div>
                    <strong>{item.title}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <small>{item.assigned_user?.name ?? 'Chưa gán'}</small>
                      {item.priority && (
                        <small
                          style={{
                            fontWeight: 700,
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: item.priority === 'high' ? '#fee2e2' : item.priority === 'medium' ? '#fef3c7' : '#eff6ff',
                            color: item.priority === 'high' ? '#b91c1c' : item.priority === 'medium' ? '#b45309' : '#1d4ed8',
                          }}
                        >
                          {item.priority === 'high' ? 'Khẩn cấp' : item.priority === 'medium' ? 'Vừa' : 'Thấp'}
                        </small>
                      )}
                    </div>
                    {item.location && <small>📍 {item.location}</small>}
                    {item.status === 'completed' && <small style={{ color: '#059669', fontWeight: 600 }}>✓ Đã hoàn thành</small>}
                    {item.status === 'postponed' && <small style={{ color: '#d97706', fontWeight: 600 }}>⏳ Đã hoãn</small>}
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

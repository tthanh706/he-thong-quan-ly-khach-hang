import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LogOut, Plus, RefreshCw, Users } from 'lucide-react';
import CalendarBoard from '../components/CalendarBoard';
import CreateItemModal from '../components/CreateItemModal';
import { createMeeting, createTask, getCalendarUsers, getMyCalendar, getTeamCalendar, logout } from '../services/calendarService';
import type { CalendarItem, CalendarView, MeetingPayload, TaskPayload, UserSummary } from '../types/calendar';

interface Props { user: UserSummary; onLogout: ()=>void; }
function iso(d:Date){ return d.toISOString().slice(0,10); }
function move(date:string,view:CalendarView,dir:number){ const d=new Date(`${date}T00:00:00`); if(view==='day') d.setDate(d.getDate()+dir); else if(view==='week') d.setDate(d.getDate()+7*dir); else d.setMonth(d.getMonth()+dir); return iso(d); }

export default function CalendarPage({user,onLogout}:Props){
  const [view,setView]=useState<CalendarView>('week'); const [date,setDate]=useState(iso(new Date())); const [scope,setScope]=useState<'my'|'team'>(user.role==='team_leader'?'team':'my');
  const [items,setItems]=useState<CalendarItem[]>([]); const [users,setUsers]=useState<UserSummary[]>([]); const [userFilter,setUserFilter]=useState<number|'all'>('all');
  const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [modal,setModal]=useState<'meeting'|'task'|null>(null);
  async function load(){ setLoading(true); setError(''); try { const [calendarResult,userResult]=await Promise.all([scope==='team'?getTeamCalendar(view,date):getMyCalendar(view,date),getCalendarUsers()]); setItems(calendarResult.data); setUsers(userResult.data);} catch(err){ setError(err instanceof Error?err.message:'Không tải được dữ liệu.'); } finally{ setLoading(false);} }
  useEffect(()=>{ void load(); },[view,date,scope]);
  const stats=useMemo(()=>({total:items.length,meetings:items.filter(i=>i.item_type==='meeting').length,tasks:items.filter(i=>i.item_type==='task').length,people:new Set(items.map(i=>i.assigned_user_id).filter(Boolean)).size}),[items]);
  async function doLogout(){ try{await logout();}finally{onLogout();} }
  async function addMeeting(data:MeetingPayload){ await createMeeting(data); await load(); }
  async function addTask(data:TaskPayload){ await createTask(data); await load(); }
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><CalendarDays/><div><strong>Lịch làm việc nhóm</strong><small>S6-07 · CRM</small></div></div><div className="userbox"><div><strong>{user.name}</strong><small>{user.role==='team_leader'?'Trưởng nhóm':'Nhân viên kinh doanh'}</small></div><button className="icon-button" onClick={doLogout}><LogOut size={18}/></button></div></header>
    <main className="page"><section className="hero"><div><h1>Lịch làm việc</h1><p>Quản lý cuộc gặp và công việc có hạn trên cùng một lịch.</p></div><div className="hero-actions"><button className="secondary" onClick={()=>setModal('task')}><Plus size={17}/>Công việc</button><button className="primary" onClick={()=>setModal('meeting')}><Plus size={17}/>Cuộc gặp</button></div></section>
    <section className="stats"><div><span>Tổng mục</span><strong>{stats.total}</strong></div><div><span>Cuộc gặp</span><strong>{stats.meetings}</strong></div><div><span>Công việc</span><strong>{stats.tasks}</strong></div><div><span>Thành viên có lịch</span><strong>{stats.people}</strong></div></section>
    <section className="toolbar"><div className="segmented">{(['day','week','month'] as CalendarView[]).map(v=><button key={v} className={view===v?'active':''} onClick={()=>setView(v)}>{v==='day'?'Ngày':v==='week'?'Tuần':'Tháng'}</button>)}</div>
      <div className="date-nav"><button onClick={()=>setDate(move(date,view,-1))}><ChevronLeft size={18}/></button><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><button onClick={()=>setDate(move(date,view,1))}><ChevronRight size={18}/></button></div>
      {user.role==='team_leader'&&<div className="segmented"><button className={scope==='my'?'active':''} onClick={()=>setScope('my')}>Lịch của tôi</button><button className={scope==='team'?'active':''} onClick={()=>setScope('team')}><Users size={15}/>Lịch nhóm</button></div>}
      <select value={userFilter} onChange={e=>setUserFilter(e.target.value==='all'?'all':Number(e.target.value))}><option value="all">Tất cả nhân viên</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
      <button className="icon-button" onClick={()=>void load()}><RefreshCw size={18}/></button>
    </section>
    {error&&<div className="error-box">{error}</div>}
    {loading?<div className="loading">Đang tải lịch...</div>:<CalendarBoard items={items} view={view} date={date} userFilter={userFilter}/>} </main>
    {modal&&<CreateItemModal type={modal} users={users.length?users:[user]} currentUser={user} onClose={()=>setModal(null)} onMeeting={addMeeting} onTask={addTask}/>} 
  </div>;
}

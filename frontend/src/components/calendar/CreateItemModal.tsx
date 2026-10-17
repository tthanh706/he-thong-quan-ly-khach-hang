import { FormEvent, useEffect, useState } from 'react';
import type { UserSummary } from '../../types/calendar';

interface Props {
  type: 'meeting' | 'task';
  users: UserSummary[];
  currentUser: UserSummary;
  onClose: () => void;
  onMeeting: (data: {assigned_user_id:number;team_leader_id:number;title:string;start_at:string;end_at:string;location?:string;description?:string}) => Promise<void>;
  onTask: (data: {assigned_user_id:number;team_leader_id:number;title:string;due_at:string;description?:string}) => Promise<void>;
}

export default function CreateItemModal({type, users, currentUser, onClose, onMeeting, onTask}: Props) {
  const [assigned, setAssigned] = useState(currentUser.role === 'staff' ? currentUser.id : (users.find(u=>u.role==='staff')?.id ?? currentUser.id));
  const [leader, setLeader] = useState(currentUser.role === 'team_leader' ? currentUser.id : (users.find(u=>u.role==='team_leader')?.id ?? currentUser.id));
  const [title,setTitle]=useState(''); const [start,setStart]=useState(''); const [end,setEnd]=useState(''); const [due,setDue]=useState('');
  const [location,setLocation]=useState(''); const [description,setDescription]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  useEffect(()=>{ setError(''); },[type]);
  async function submit(e:FormEvent){ e.preventDefault(); setLoading(true); setError(''); try {
    if(type==='meeting') await onMeeting({assigned_user_id:assigned,team_leader_id:leader,title,start_at:start.replace('T',' ')+':00',end_at:end.replace('T',' ')+':00',location:location||undefined,description:description||undefined});
    else await onTask({assigned_user_id:assigned,team_leader_id:leader,title,due_at:due.replace('T',' ')+':00',description:description||undefined});
    onClose();
  } catch(err){ setError(err instanceof Error?err.message:'Có lỗi xảy ra.'); } finally { setLoading(false); }}
  return <div className="modal-backdrop"><div className="modal-card"><div className="modal-head"><h2>{type==='meeting'?'Tạo cuộc gặp':'Tạo công việc'}</h2><button onClick={onClose}>×</button></div>
    <form onSubmit={submit} className="form-grid">
      <label>Nhân viên<select value={assigned} onChange={e=>setAssigned(Number(e.target.value))}>{users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></label>
      <label>Trưởng nhóm<select value={leader} onChange={e=>setLeader(Number(e.target.value))}>{users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></label>
      <label className="span-2">Tiêu đề<input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
      {type==='meeting' ? <>
        <label>Bắt đầu<input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required /></label>
        <label>Kết thúc<input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} required /></label>
        <label className="span-2">Địa điểm<input value={location} onChange={e=>setLocation(e.target.value)} /></label>
      </> : <label className="span-2">Hạn công việc<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} required /></label>}
      <label className="span-2">Mô tả<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} /></label>
      {error && <div className="error-box span-2">{error}</div>}
      <div className="modal-actions span-2"><button type="button" className="secondary" onClick={onClose}>Hủy</button><button className="primary" disabled={loading}>{loading?'Đang lưu...':'Lưu'}</button></div>
    </form></div></div>;
}

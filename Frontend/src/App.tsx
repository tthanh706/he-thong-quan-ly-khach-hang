import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import CalendarPage from './pages/CalendarPage';
import { getCurrentUser } from './services/calendarService';
import type { UserSummary } from './types/calendar';

export default function App(){
  const [user,setUser]=useState<UserSummary|null>(null); const [checking,setChecking]=useState(true);
  useEffect(()=>{ const token=localStorage.getItem('session_token'); if(!token){setChecking(false);return;} getCurrentUser().then(r=>setUser(r.data)).catch(()=>localStorage.removeItem('session_token')).finally(()=>setChecking(false)); },[]);
  if(checking) return <div className="loading-page">Đang kiểm tra phiên đăng nhập...</div>;
  if(!user) return <LoginForm onLogin={setUser}/>;
  return <CalendarPage user={user} onLogout={()=>setUser(null)}/>;
}

import { useEffect, useState } from 'react';
import LoginView from './components/LoginView';
import DashboardPage from './pages/DashboardPage';
import { getCurrentUser } from './services/opportunityService';
import type { UserSummary } from './types/opportunity';
import './styles.css';

export default function App() {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      setCheckingSession(false);
      return;
    }

    getCurrentUser()
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_user');
      })
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return <div className="center-screen">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!user) {
    return <LoginView onLoggedIn={setUser} />;
  }

  return <DashboardPage user={user} onLogout={() => setUser(null)} />;
}

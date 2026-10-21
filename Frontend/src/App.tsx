import { useCallback, useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { LeadAssignmentPage } from './pages/LeadAssignmentPage';
import { authService } from './services/authService';
import type { CurrentUser } from './types/lead';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const loadCurrentUser = useCallback(async (): Promise<void> => {
    const user = await authService.me();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      if (!authService.hasToken()) {
        setCheckingSession(false);
        return;
      }

      try {
        await loadCurrentUser();
      } catch {
        setCurrentUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    void bootstrap();
  }, [loadCurrentUser]);

  const handleLoggedIn = async (): Promise<void> => {
    await loadCurrentUser();
  };

  const handleLogout = async (): Promise<void> => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (checkingSession) {
    return <div className="app-loader">Đang kiểm tra phiên đăng nhập...</div>;
  }

  if (!currentUser) {
    return <LoginPage onLoggedIn={handleLoggedIn} />;
  }

  return <LeadAssignmentPage currentUser={currentUser} onLogout={handleLogout} />;
}

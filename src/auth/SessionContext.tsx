import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Scope, Team, User } from '../types';
import { ALLOWED_SCOPES_BY_ROLE, DEFAULT_SCOPE_BY_ROLE, resolveScope } from '../auth/permissions';
import { store } from '../services/store';

const STORAGE_KEY = 'scrum5.currentUserId';

interface SessionValue {
  user: User | null;
  users: User[];
  teams: Team[];
  /** Phạm vi đang chọn trên giao diện (luôn nằm trong danh sách vai trò được phép) */
  scope: Scope;
  allowedScopes: Scope[];
  teamName: string;
  login: (userId: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  setScope: (scope: Scope) => void;
  /** Đếm thay đổi dữ liệu để các trang danh sách tự làm mới */
  dataVersion: number;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStoredUserId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function SessionProvider({
  children,
  initialUserId,
}: {
  children: ReactNode;
  /** Dùng cho kiểm thử: cố định tài khoản đang đăng nhập thay vì đọc localStorage. */
  initialUserId?: string | null;
}) {
  const users = store.users();
  const [userId, setUserId] = useState<string | null>(
    () => initialUserId ?? readStoredUserId(),
  );
  const [scopeState, setScopeState] = useState<Scope | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  const user = useMemo(
    () => users.find((item) => item.id === userId) ?? null,
    [users, userId],
  );

  useEffect(() => store.subscribe(() => setDataVersion((version) => version + 1)), []);

  const defaultScope = user ? DEFAULT_SCOPE_BY_ROLE[user.role] : 'own';
  const scope = scopeState && user && ALLOWED_SCOPES_BY_ROLE[user.role].includes(scopeState)
    ? scopeState
    : defaultScope;

  const login = useCallback((id: string) => {
    setUserId(id);
    setScopeState(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* bỏ qua khi trình duyệt chặn localStorage */
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    setScopeState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
  }, []);

  const value = useMemo<SessionValue>(() => ({
    user,
    users,
    teams: store.teams(),
    scope,
    allowedScopes: user ? ALLOWED_SCOPES_BY_ROLE[user.role] : [],
    teamName: user ? store.teamName(user.teamId) : '',
    login,
    logout,
    switchUser: login,
    setScope: (next: Scope) => setScopeState(next),
    dataVersion,
  }), [user, users, scope, login, logout, dataVersion]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession phải được dùng bên trong <SessionProvider>.');
  return context;
}

/** Ngữ cảnh yêu cầu để truyền vào ScopedRepository (dữ liệu sở hữu + phạm vi đã chọn) */
export function useRequestContext() {
  const { user, scope } = useSession();
  return useMemo(
    () => ({ user: user!, scopeRequest: resolveScope(user!, scope) }),
    [user, scope],
  );
}

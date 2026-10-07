const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('session_token');
  
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    if (netErr.name !== 'AbortError') {
      window.dispatchEvent(
        new CustomEvent('app:http-error', {
          detail: {
            statusCode: 500,
            message: 'Không thể kết nối đến máy chủ máy chủ backend (127.0.0.1:8000).',
          },
        })
      );
    }
    throw netErr;
  }

  const body = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (body.code === 'SESSION_EXPIRED') {
      localStorage.removeItem('session_token');
    }
    window.dispatchEvent(
      new CustomEvent('app:http-error', {
        detail: {
          statusCode: 401,
          message: body.message ?? 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
        },
      })
    );
    throw new Error(body.message ?? 'Phiên đăng nhập đã hết hạn.');
  }

  if ([402, 403, 404, 500].includes(response.status)) {
    window.dispatchEvent(
      new CustomEvent('app:http-error', {
        detail: {
          statusCode: response.status,
          message: body.message,
          code: body.code,
        },
      })
    );
  }

  if (!response.ok) {
    throw new Error(body.message ?? 'Có lỗi xảy ra.');
  }

  return body as T;
}

api.get = <T>(path: string, options?: RequestInit) => api<T>(path, { ...options, method: 'GET' });
api.post = <T>(path: string, body?: any, options?: RequestInit) =>
  api<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined });
api.put = <T>(path: string, body?: any, options?: RequestInit) =>
  api<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined });
api.patch = <T>(path: string, body?: any, options?: RequestInit) =>
  api<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
api.delete = <T>(path: string, options?: RequestInit) =>
  api<T>(path, { ...options, method: 'DELETE' });

export const customersApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.assigned_to) params.set('assigned_to', String(filters.assigned_to));
    const qs = params.toString();
    return api<any>(`/customers${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => api<any>(`/customers/${id}`),
  create: (payload: any) => api<any>('/customers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: any) => api<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: number) => api<any>(`/customers/${id}`, { method: 'DELETE' }),
  remove: (id: number) => api<any>(`/customers/${id}`, { method: 'DELETE' }),
};

export const campaignsApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    const qs = params.toString();
    return api<any>(`/campaigns${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => api<any>(`/campaigns/${id}`),
  create: (payload: any) => api<any>('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: any) => api<any>(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: number) => api<any>(`/campaigns/${id}`, { method: 'DELETE' }),
  remove: (id: number) => api<any>(`/campaigns/${id}`, { method: 'DELETE' }),
  changeStatus: (id: number, status: string) => api<any>(`/campaigns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const changePasswordApi = (payload: any) =>
  api<{ message?: string }>('/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const authApi = {
  login: (payload: { email: string; password: string }) => api<{ success: boolean; session_token: string; user: import('../types').User }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  logout: () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    return api<{ success: boolean }>('/logout', {
      method: 'POST',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  },
  getCurrentUser: () => api<{ success: boolean; user: import('../types').User }>('/me'),
};

export async function login(email: string, password: string) {
  return authApi.login({ email, password });
}

export const getCurrentUser = authApi.getCurrentUser;


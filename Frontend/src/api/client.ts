export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('session_token');
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`/api${path}`, { ...options, headers });
  const text = await response.text();
  let body: T | ApiErrorBody = {} as T;
  if (text) {
    try { body = JSON.parse(text) as T | ApiErrorBody; }
    catch { body = { message: text }; }
  }

  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem('session_token');
    const errorBody = body as ApiErrorBody;
    const validationMessage = errorBody.errors ? Object.values(errorBody.errors).flat()[0] : undefined;
    throw new Error(validationMessage ?? errorBody.message ?? `HTTP ${response.status}`);
  }

  return body as T;
}

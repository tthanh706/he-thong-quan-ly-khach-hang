const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_KEY = 'session_token';

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: unknown;

  public constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string') {
    return record.message;
  }

  const errors = record.errors;
  if (typeof errors === 'object' && errors !== null) {
    for (const value of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0];
      }
      if (typeof value === 'string') {
        return value;
      }
    }
  }

  return null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getSessionToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSessionToken();
    }

    throw new ApiError(
      getMessage(payload) ?? `Yêu cầu thất bại (${response.status}).`,
      response.status,
      payload,
    );
  }

  return payload as T;
}

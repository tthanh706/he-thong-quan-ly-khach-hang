interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('session_token');
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
    localStorage.removeItem('session_token');
    localStorage.removeItem('current_user');
  }

  if (!response.ok) {
    const error = body as ErrorResponse | null;
    const validationMessage = error?.errors
      ? Object.values(error.errors).flat()[0]
      : undefined;

    throw new Error(
      validationMessage ?? error?.message ?? 'Có lỗi xảy ra khi kết nối máy chủ.'
    );
  }

  return body as T;
}

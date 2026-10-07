const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

interface ApiErrorResponse {
  message?: string;
}

function getHeaders(options: RequestInit): Headers {
  const token = localStorage.getItem("session_token");
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getHeaders(options),
  });

  const data = (await response.json()) as ApiErrorResponse & T;

  if (!response.ok) {
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API.");
  }

  return data;
}

export async function apiDownload(
  endpoint: string,
  fileName: string,
): Promise<void> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: getHeaders({}),
  });

  if (!response.ok) {
    let message = "Không thể tải file Excel.";

    try {
      const data = (await response.json()) as ApiErrorResponse;

      if (data.message) {
        message = data.message;
      }
    } catch {
      // Response không phải JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

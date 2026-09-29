export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    value,
  );

export const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value);

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  const first = parts[0] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

function escapeCsvCell(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Chuyển danh sách bản ghi (đã lọc theo phạm vi) thành nội dung CSV mở được bằng Excel. */
export function toCsv<T>(rows: readonly T[], columns: readonly ExportColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCsvCell(column.value(row))).join(','));
  return [header, ...body].join('\r\n');
}

/** Thêm BOM để Excel đọc đúng tiếng Việt có dấu. */
export function toExcelBlob(csv: string): Blob {
  return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
}

export function excelFileName(entityLabel: string, scopeLabel: string, at: Date = new Date()): string {
  const stamp = [
    at.getFullYear(),
    String(at.getMonth() + 1).padStart(2, '0'),
    String(at.getDate()).padStart(2, '0'),
    '-',
    String(at.getHours()).padStart(2, '0'),
    String(at.getMinutes()).padStart(2, '0'),
  ].join('');
  const slug = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .toLowerCase();
  return `${slug(entityLabel)}-${slug(scopeLabel)}-${stamp}.csv`;
}

/** Xuất Excel (định dạng CSV tương thích Excel). Chỉ dùng trong trình duyệt. */
export function exportToExcel<T>(
  fileName: string,
  rows: readonly T[],
  columns: readonly ExportColumn<T>[],
): number {
  const csv = toCsv(rows, columns);
  const blob = toExcelBlob(csv);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return rows.length;
}

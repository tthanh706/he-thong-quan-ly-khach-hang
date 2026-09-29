import type { OwnedRecord } from '../types';
import type { ColumnDef, RowHelpers } from '../config/entities';

interface Props<T extends OwnedRecord> {
  rows: T[];
  columns: ColumnDef<T>[];
  helpers: RowHelpers;
  onOpen: (row: T) => void;
}

export function DataTable<T extends OwnedRecord>({
  rows,
  columns,
  helpers,
  onOpen,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="empty">
        <strong>Không có bản ghi phù hợp</strong>
        <span>
          Thử xoá từ khoá tìm kiếm hoặc đổi bộ lọc. Nếu bạn nghi ngờ thiếu dữ liệu, hãy liên hệ
          quản lý để được cấp quyền xem phạm vi khác.
        </span>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onOpen(row)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onOpen(row);
              }}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                  {column.render
                    ? column.render(row, helpers)
                    : String(row[column.key as keyof T] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

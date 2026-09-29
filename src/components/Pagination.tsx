interface Props {
  page: number;
  pageCount: number;
  pageSize: number;
  matched: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, pageSize, matched, onChange }: Props) {
  if (matched === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, matched);

  return (
    <div className="pagination">
      <span className="pagination__info">
        Đang xem {from}–{to} trong {matched} bản ghi
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          Trước
        </button>
        <span>
          Trang {page}/{pageCount}
        </span>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

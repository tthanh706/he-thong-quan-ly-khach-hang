import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
}

export default function Pagination({ currentPage, lastPage, total, from, to, onPage }: Props) {
  return (
    <div className="pagination">
      <span className="pagination-info">
        Hiển thị {from}–{to} / {total} kết quả
      </span>
      <div className="pagination-btns">
        <button
          className="pg-btn"
          disabled={currentPage <= 1}
          onClick={() => onPage(currentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: lastPage }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - currentPage) <= 2)
          .map((p) => (
            <button
              key={p}
              className={`pg-btn ${p === currentPage ? 'pg-btn--active' : ''}`}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          ))}
        <button
          className="pg-btn"
          disabled={currentPage >= lastPage}
          onClick={() => onPage(currentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

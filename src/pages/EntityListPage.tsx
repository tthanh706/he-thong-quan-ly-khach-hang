import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EntityConfig, RowHelpers } from '../config/entities';
import { useRequestContext, useSession } from '../auth/SessionContext';
import { repository } from '../services/repository';
import { store } from '../services/store';
import { excelFileName, exportToExcel } from '../utils/exportExcel';
import { SCOPE_LABEL } from '../types';
import { DataTable } from '../components/DataTable';
import { Pagination } from '../components/Pagination';
import type { OwnedRecord } from '../types';

const PAGE_SIZE = 8;

export function EntityListPage<T extends OwnedRecord>({ config }: { config: EntityConfig<T> }) {
  const ctx = useRequestContext();
  const { dataVersion } = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>(config.defaultSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [notice, setNotice] = useState<string | null>(null);

  const options = useMemo(
    () => ({ search, filters, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, filters, sortBy, sortDir, page],
  );

  const result = repository.list<T>(config.entity, options, ctx);
  const stats = repository.scopeStats(ctx).find((item) => item.entity === config.entity);

  const helpers: RowHelpers = useMemo(
    () => ({
      ownerName: (id) => store.userName(id),
      teamName: (id) => store.teamName(id),
      customerName: (id) => repository.lookupCustomer(id, ctx)?.name ?? '—',
      isCustomerVisible: (id) => Boolean(repository.lookupCustomer(id, ctx)),
    }),
    [ctx],
  );

  const exportColumns = config.columns.map((column) => ({
    header: column.header,
    value: (row: T): string | number => {
      if (column.exportValue) return column.exportValue(row, helpers);
      return String(row[column.key as keyof T] ?? '');
    },
  }));

  const handleExport = () => {
    const { rows, hiddenByScope } = repository.exportRows<T>(config.entity, options, ctx);
    const fileName = excelFileName(config.label, SCOPE_LABEL[result.scope]);
    exportToExcel(fileName, rows, exportColumns);
    setNotice(
      `Đã xuất ${rows.length} bản ghi ${config.label.toLowerCase()} theo phạm vi `
      + `"${SCOPE_LABEL[result.scope]}" (${hiddenByScope} bản ghi ngoài phạm vi đã được loại khỏi file).`,
    );
  };

  const handleCreate = () => {
    repository.create<T>(config.entity, config.draft(ctx.user.id), ctx);
    setNotice(
      `Đã tạo ${config.label.toLowerCase()} mới. Bản ghi được gán sở hữu tự động cho ${ctx.user.name}.`,
    );
  };

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setFilters({});
    setPage(1);
  };

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>{config.label}</h1>
          <p className="page__summary">{config.summary}</p>
        </div>
        <div className="page__stats">
          <div className="stat">
            <span>Trong phạm vi</span>
            <strong>{result.totalInScope}</strong>
          </div>
          <div className="stat stat--muted">
            <span>Bị ẩn bởi phân quyền</span>
            <strong>{result.hiddenByScope}</strong>
          </div>
        </div>
      </header>

      {stats && stats.hidden > 0 && (
        <p className="notice notice--info">
          Bạn đang xem <strong>{SCOPE_LABEL[result.scope]}</strong>. Hệ thống đã tự động ẩn{' '}
          <strong>{stats.hidden}</strong> {config.label.toLowerCase()} ngoài phạm vi — kể cả khi tìm kiếm
          và khi xuất Excel.
        </p>
      )}

      <div className="toolbar">
        <div className="toolbar__search">
          <input
            type="search"
            value={search}
            placeholder={config.searchPlaceholder}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {config.filters.map((filter) => (
          <label key={filter.key} className="toolbar__filter">
            <span>{filter.label}</span>
            <select
              value={filters[filter.key] ?? ''}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, [filter.key]: event.target.value }));
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        <div className="toolbar__actions">
          <button type="button" className="btn btn--ghost" onClick={resetFilters}>
            Xoá lọc
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleExport}
            disabled={!repository.canAction(ctx, 'export')}
            title="Chỉ xuất những bản ghi nằm trong phạm vi của bạn"
          >
            ⤓ Xuất Excel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCreate}
            disabled={!repository.canAction(ctx, 'create')}
          >
            + Thêm {config.label.toLowerCase()}
          </button>
        </div>
      </div>

      {notice && (
        <p className="notice notice--success" onClick={() => setNotice(null)} role="status">
          {notice}
        </p>
      )}

      <div className="panel">
        <div className="panel__head">
          <strong>
            {result.matched} bản ghi khớp bộ lọc
          </strong>
          <div className="panel__sort">
            Sắp xếp:
            {config.columns.map((column) => (
              <button
                key={column.key}
                type="button"
                className={`chip${sortBy === column.key ? ' chip--active' : ''}`}
                onClick={() => toggleSort(column.key)}
              >
                {column.header}
                {sortBy === column.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          rows={result.rows}
          columns={config.columns}
          helpers={helpers}
          onOpen={(row) => navigate(`${config.route}/${row.id}`)}
        />

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          pageSize={result.pageSize}
          matched={result.matched}
          onChange={setPage}
        />
      </div>

      <p className="footnote">
        Quy tắc: mọi truy vấn danh sách đều được lọc theo phạmvi của tài khoản trước khi tìm kiếm, phân trang
        và xuất Excel; vì vậy không thể lấy dữ liệu ngoài phạm vi bằng cách đoán mã bản ghi.
        Môi trường demo dữ liệu đã thay đổi {dataVersion} lần.
      </p>
    </section>
  );
}

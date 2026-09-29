import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { EntityConfig, RowHelpers } from '../config/entities';
import { ENTITY_CONFIGS } from '../config/entities';
import { useRequestContext, useSession } from '../auth/SessionContext';
import { isAccessDenied, type AccessDeniedError } from '../auth/errors';
import { repository } from '../services/repository';
import { store } from '../services/store';
import { filterByScope } from '../auth/scope';
import type { OwnedRecord } from '../types';
import { ENTITY_LABEL, SCOPE_LABEL } from '../types';
import { AccessDenied } from '../components/AccessDenied';
import { ScopeBadge } from '../components/ScopeBadge';

export function EntityDetailPage<T extends OwnedRecord>({ config }: { config: EntityConfig<T> }) {
  const { id = '' } = useParams();
  const ctx = useRequestContext();
  const { dataVersion } = useSession();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState<string | null>(null);

  const outcome = useMemo(() => {
    try {
      return { record: repository.get<T>(config.entity, id, ctx) as T | null, denied: null as AccessDeniedError | null, missing: null as string | null };
    } catch (error) {
      if (isAccessDenied(error)) {
        return { record: null, denied: error, missing: null };
      }
      return {
        record: null,
        denied: null,
        missing: error instanceof Error ? error.message : 'Không tìm thấy bản ghi.',
      };
    }
  }, [config.entity, id, ctx, dataVersion]);

  const helpers: RowHelpers = useMemo(
    () => ({
      ownerName: (ownerId) => store.userName(ownerId),
      teamName: (teamId) => store.teamName(teamId),
      customerName: (customerId) => repository.lookupCustomer(customerId, ctx)?.name ?? '—',
      isCustomerVisible: (customerId) => Boolean(repository.lookupCustomer(customerId, ctx)),
    }),
    [ctx],
  );

  if (outcome.denied) {
    return (
      <section className="page">
        <AccessDenied error={outcome.denied} backTo={config.route} />
      </section>
    );
  }

  if (outcome.missing || !outcome.record) {
    return (
      <section className="page">
        <div className="empty empty--card">
          <strong>Không tìm thấy bản ghi</strong>
          <span>{outcome.missing ?? 'Bản ghi không tồn tại hoặc đã bị xoá.'}</span>
          <Link className="btn btn--primary" to={config.route}>
            Quay lại danh sách
          </Link>
        </div>
      </section>
    );
  }

  const record = outcome.record;
  const fields = config.detailFields(record, helpers);
  const title = fields[1]?.value ?? fields[0]?.value ?? record.id;
  const relatedCustomerId = (record as unknown as { customerId?: string }).customerId;

  const related = relatedCustomerId
    ? ENTITY_CONFIGS.filter((item) => item.entity !== config.entity).map((item) => {
      const rows = filterByScope(ctx, store.table(item.entity)).rows as unknown as {
        id: string;
        customerId: string;
      }[];
      return {
        config: item,
        rows: rows.filter((row) => row.customerId === relatedCustomerId),
      };
    })
    : [];

  const handleDelete = () => {
    try {
      repository.remove(config.entity, record.id, ctx);
      navigate(config.route);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể thực hiện thao tác.');
    }
  };

  return (
    <section className="page">
      <nav className="breadcrumb">
        <Link to={config.route}>{config.label}</Link>
        <span>/</span>
        <span>{record.id}</span>
      </nav>

      <header className="page__head">
        <div>
          <h1>{title}</h1>
          <p className="page__summary">
            Bạn đang xem theo phạm vi <ScopeBadge scope={repository.scopeOf(ctx)} /> — mọi trường dữ liệu
            dưới đây đều đã được kiểm tra quyền truy cập.
          </p>
        </div>
        <div className="page__actions">
          <Link className="btn btn--ghost" to={config.route}>
            Quay lại
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={!repository.canAction(ctx, 'delete')}
            title={
              repository.canAction(ctx, 'delete')
                ? undefined
                : 'Vai trò của bạn không được phép xoá bản ghi'
            }
          >
            Xoá bản ghi
          </button>
        </div>
      </header>

      {actionError && (
        <p className="notice notice--error" role="alert">
          {actionError}
        </p>
      )}

      <div className="detail-grid">
        <div className="panel">
          <div className="panel__head">
            <strong>Thông tin {config.label.toLowerCase()}</strong>
          </div>
          <dl className="detail-list">
            {fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel">
          <div className="panel__head">
            <strong>Thông tin phân quyền</strong>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Phạm vi hiện tại</dt>
              <dd>
                <ScopeBadge scope={repository.scopeOf(ctx)} />
              </dd>
            </div>
            <div>
              <dt>Người đang đăng nhập</dt>
              <dd>
                {ctx.user.name} · {ctx.user.title}
              </dd>
            </div>
            <div>
              <dt>Người sở hữu bản ghi</dt>
              <dd>{helpers.ownerName(record.ownerId)}</dd>
            </div>
            <div>
              <dt>Nhóm sở hữu</dt>
              <dd>{helpers.teamName(record.teamId)}</dd>
            </div>
            <div>
              <dt>Bạn có quyền sửa?</dt>
              <dd>
                {repository.canAction(ctx, 'edit') ? 'Có, trong phạm vi dữ liệu hiện tại' : 'Không'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <div className="panel">
          <div className="panel__head">
            <strong>Bản ghi liên quan (chỉ hiển thị trong phạm vi của bạn)</strong>
          </div>
          <ul className="related-list">
            {related.map((group) => (
              <li key={group.config.entity}>
                <span className="related-list__title">
                  {ENTITY_LABEL[group.config.entity]} ({group.rows.length})
                </span>
                {group.rows.length === 0 && <span className="text-muted">Không có bản ghi trong phạm vi</span>}
                {group.rows.map((row) => (
                  <Link key={row.id} to={`${group.config.route}/${row.id}`}>
                    {row.id}
                  </Link>
                ))}
              </li>
            ))}
          </ul>
          <p className="footnote">
            Nếu bản ghi liên quan nằm ngoài phạm vi, thao tác mở sẽ hiển thị thông báo “không có quyền” thay vì
            dữ liệu. Phạm vi hiện tại: {SCOPE_LABEL[repository.scopeOf(ctx)].toLowerCase()}.
          </p>
        </div>
      )}
    </section>
  );
}

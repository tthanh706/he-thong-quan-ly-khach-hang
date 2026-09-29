import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRequestContext, useSession } from '../auth/SessionContext';
import { repository } from '../services/repository';
import { store } from '../services/store';
import { ENTITY_CONFIGS } from '../config/entities';
import { ACTION_LABEL, ALLOWED_SCOPES_BY_ROLE, PERMISSION_MATRIX } from '../auth/permissions';
import type { Action } from '../auth/permissions';
import { ROLE_LABEL, SCOPE_LABEL } from '../types';
import type { Opportunity } from '../types';
import { ScopeBadge } from '../components/ScopeBadge';
import { formatCurrency } from '../utils/format';

const ACTIONS: Action[] = ['view', 'create', 'edit', 'delete', 'export'];

export function DashboardPage() {
  const { user, scope, allowedScopes, teamName, dataVersion } = useSession();
  const ctx = useRequestContext();
  const stats = useMemo(() => repository.scopeStats(ctx), [ctx, dataVersion]);

  const pipeline = useMemo(() => {
    const rows = repository.exportRows<Opportunity>('opportunity', {}, ctx).rows;
    return rows.reduce((sum, row) => sum + row.amount, 0);
  }, [ctx]);

  if (!user) return null;

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Xin chào, {user.name}</h1>
          <p className="page__summary">
            {ROLE_LABEL[user.role]} · {teamName} · Phạm vi đang xem: <ScopeBadge scope={scope} />
          </p>
        </div>
        <div className="page__actions">
          <Link className="btn btn--ghost" to="/access-checks">
            Xem kết quả kiểm thử phân quyền
          </Link>
        </div>
      </header>

      <div className="cards">
        {stats.map((stat) => (
          <div className="card" key={stat.entity}>
            <span className="card__label">{stat.label}</span>
            <strong className="card__value">{stat.visible}</strong>
            <span className="card__hint">
              hiển thị / {stat.total} tổng số · {stat.hidden} bản ghi ngoài phạm vi
            </span>
          </div>
        ))}
        <div className="card card--accent">
          <span className="card__label">Giá trị cơ hội trong phạm vi</span>
          <strong className="card__value">{formatCurrency(pipeline)}</strong>
          <span className="card__hint">chỉ tính các cơ hội bạn được phép xem</span>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel__head">
            <strong>Phạm vi dữ liệu bạn được phép chọn</strong>
          </div>
          <ul className="plain-list">
            {allowedScopes.map((item) => (
              <li key={item}>
                <ScopeBadge scope={item} />
                <span className="text-muted">
                  {item === 'own'
                    ? 'Chỉ các bản ghi bạn tạo/sở hữu.'
                    : item === 'team'
                      ? 'Bao gồm bản ghi của các thành viên cùng nhóm, kể cả người không phải bạn.'
                      : 'Toàn bộ khách hàng, cơ hội, hoạt động và báo giá của công ty.'}
                </span>
              </li>
            ))}
          </ul>
          <p className="footnote">
            Vai trò <strong>{ROLE_LABEL[user.role]}</strong> được phép chọn:{' '}
            {ALLOWED_SCOPES_BY_ROLE[user.role].map((item) => SCOPE_LABEL[item]).join(', ')}.
            Các phạm vi khác bị hệ thống từ chối ngay cả khi sửa tham số trên URL.
          </p>
        </div>

        <div className="panel">
          <div className="panel__head">
            <strong>Ma trận quyền theo vai trò</strong>
          </div>
          <div className="table-wrap">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Vai trò</th>
                  {ACTIONS.map((action) => (
                    <th key={action} className="center">
                      {ACTION_LABEL[action]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(PERMISSION_MATRIX) as (keyof typeof PERMISSION_MATRIX)[]).map((role) => (
                  <tr key={role}>
                    <td>{ROLE_LABEL[role]}</td>
                    {ACTIONS.map((action) => (
                      <td key={action} className="center">
                        {PERMISSION_MATRIX[role][action] ? '✔' : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Quyền theo vai trò chỉ quyết định “được phép làm gì”. Quyền xem/chỉnh sửa từng bản ghi còn phụ thuộc
            phạm vi dữ liệu sở hữu.
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <strong>Các phân hệ đang được phân quyền</strong>
        </div>
        <div className="module-grid">
          {ENTITY_CONFIGS.map((config) => (
            <Link key={config.entity} className="module" to={config.route}>
              <span className="module__icon">{config.icon}</span>
              <span>
                <strong>{config.label}</strong>
                <small>{config.summary}</small>
              </span>
            </Link>
          ))}
        </div>
        <p className="footnote">
          Dữ liệu mô phỏng gồm {store.table('customer').length} khách hàng,{' '}
          {store.table('opportunity').length} cơ hội, {store.table('activity').length} hoạt động và{' '}
          {store.table('quote').length} báo giá thuộc 3 nhóm.
        </p>
      </div>
    </section>
  );
}

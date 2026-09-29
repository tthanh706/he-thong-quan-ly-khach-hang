import { Link } from 'react-router-dom';
import { ENTITY_LABEL, SCOPE_LABEL } from '../types';
import type { AccessDeniedError } from '../auth/errors';

interface Props {
  error: AccessDeniedError;
  backTo?: string;
}

export function AccessDenied({ error, backTo = '/' }: Props) {
  const label = ENTITY_LABEL[error.entity];

  return (
    <div className="denied" role="alert">
      <div className="denied__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2>Bạn không có quyền truy cập {label.toLowerCase()} này</h2>
      <p className="denied__message">{error.message}</p>

      <dl className="denied__grid">
        <div>
          <dt>Mã bản ghi</dt>
          <dd>{error.recordId}</dd>
        </div>
        <div>
          <dt>Phạm vi hiện tại</dt>
          <dd>{SCOPE_LABEL[error.scope]}</dd>
        </div>
        <div>
          <dt>Người sở hữu bản ghi</dt>
          <dd>{error.recordOwnerName}</dd>
        </div>
        <div>
          <dt>Nhóm sở hữu</dt>
          <dd>{error.recordTeamName}</dd>
        </div>
      </dl>

      <p className="denied__hint">
        Muốn xem dữ liệu này, hãy liên hệ trưởng nhóm hoặc Giám đốc kinh doanh để được cấp quyền,
        hoặc chuyển sang phạm vi <strong>{SCOPE_LABEL.all.toLowerCase()}</strong> nếu vai trò của bạn được phép.
      </p>

      <div className="denied__actions">
        <Link className="btn btn--primary" to={backTo}>
          Quay lại danh sách
        </Link>
      </div>
    </div>
  );
}

import type { EntityName, Scope, User } from '../types';
import { ENTITY_LABEL, ROLE_LABEL, SCOPE_LABEL } from '../types';

export class AccessDeniedError extends Error {
  readonly entity: EntityName;
  readonly recordId: string;
  readonly scope: Scope;
  readonly user: User;
  readonly recordOwnerName: string;
  readonly recordTeamName: string;

  constructor(params: {
    entity: EntityName;
    recordId: string;
    scope: Scope;
    user: User;
    recordOwnerName: string;
    recordTeamName: string;
    action: string;
  }) {
    super(buildAccessDeniedMessage(params));
    this.name = 'AccessDeniedError';
    this.entity = params.entity;
    this.recordId = params.recordId;
    this.scope = params.scope;
    this.user = params.user;
    this.recordOwnerName = params.recordOwnerName;
    this.recordTeamName = params.recordTeamName;
  }
}

/**
 * Sinh thông báo tiếng Việt rõ ràng khi người dùng chạm phải bản ghi ngoài phạm vi.
 * Thông báo nêu rõ: ai, phạm vi hiện tại, bản ghi thuộc về ai và cách xử lý.
 */
export function buildAccessDeniedMessage(params: {
  entity: EntityName;
  recordId: string;
  scope: Scope;
  user: User;
  recordOwnerName: string;
  recordTeamName: string;
  action: string;
}): string {
  const { entity, recordId, scope, user, recordOwnerName, recordTeamName, action } = params;
  const label = ENTITY_LABEL[entity];

  const why =
    scope === 'own'
      ? `Phạm vi hiện tại của bạn là "${SCOPE_LABEL.own}" nên chỉ thấy các bản ghi bạn trực tiếp sở hữu.`
      : scope === 'team'
        ? `Phạm vi hiện tại của bạn là "${SCOPE_LABEL.team}" nên chỉ thấy dữ liệu của nhóm ${recordTeamName}.`
        : `Phạm vi hiện tại của bạn là "${SCOPE_LABEL[scope]}" nên chỉ thấy dữ liệu bạn sở hữu.`;

  return [
    `Không có quyền thực hiện: ${action} ${label.toLowerCase()} "${recordId}".`,
    why,
    `Bản ghi này do ${recordOwnerName} (nhóm ${recordTeamName}) sở hữu, nằm ngoài phạm vi dữ liệu của ${ROLE_LABEL[user.role].toLowerCase()} đang đăng nhập.`,
    'Vui lòng liên hệ trưởng nhóm hoặc Giám đốc kinh doanh để được cấp quyền truy cập.',
  ].join(' ');
}

export function isAccessDenied(error: unknown): error is AccessDeniedError {
  return error instanceof AccessDeniedError
    || (typeof error === 'object'
      && error !== null
      && (error as { name?: string }).name === 'AccessDeniedError');
}

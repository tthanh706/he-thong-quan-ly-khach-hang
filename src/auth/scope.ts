import type { EntityName, OwnedRecord, Scope, ScopeRequest, User } from '../types';
import { AccessDeniedError } from './errors';
import { resolveScope } from './permissions';

/** Ngữ cảnh yêu cầu: ai đang hỏi và xem theo phạm vi nào */
export interface RequestContext {
  user: User;
  /** Phạm vi do người dùng chọn; 'auto' = lấy mặc định theo vai trò */
  scopeRequest?: ScopeRequest;
}

export function contextScope(ctx: RequestContext): Scope {
  return resolveScope(ctx.user, ctx.scopeRequest ?? 'auto');
}

export interface RecordMeta {
  ownerName: string;
  teamName: string;
  title: string;
}

/**
 * Quy tắc phạm vi dữ liệu sở hữu (row-level):
 *  - 'own' : chỉ bản ghi do chính người dùng sở hữu
 *  - 'team': bản ghi của mình + bản ghi của các thành viên cùng nhóm
 *  - 'all' : mọi bản ghi trong hệ thống
 */
export function isRecordInScope(user: User, scope: Scope, record: OwnedRecord): boolean {
  if (record.ownerId === user.id) return true;
  if (scope === 'all') return true;
  if (scope === 'team') return record.teamId === user.teamId;
  return false;
}

/** Một bản ghi nằm trong phạm vi luôn được sửa, kể cả bản ghi của đồng nghiệp trong nhóm */
export function canReadRecord(user: User, scope: Scope, record: OwnedRecord): boolean {
  return isRecordInScope(user, scope, record);
}

export function canWriteRecord(user: User, scope: Scope, record: OwnedRecord): boolean {
  return isRecordInScope(user, scope, record);
}

/** Giải thích vì sao bản ghi bị chặn (dùng cho thông báo tiếng Việt) */
export function buildDeniedError(
  entity: EntityName,
  record: OwnedRecord,
  meta: RecordMeta,
  ctx: RequestContext,
  action: string,
): AccessDeniedError {
  return new AccessDeniedError({
    entity,
    recordId: record.id,
    scope: contextScope(ctx),
    user: ctx.user,
    recordOwnerName: meta.ownerName,
    recordTeamName: meta.teamName,
    action,
  });
}

/** Lọc danh sách bản ghi theo phạm vi - nền tảng cho mọi truy vấn danh sách */
export function filterByScope<T extends OwnedRecord>(
  ctx: RequestContext,
  rows: readonly T[],
): { scope: Scope; rows: T[]; hiddenCount: number } {
  const scope = contextScope(ctx);
  const visible = rows.filter((row) => isRecordInScope(ctx.user, scope, row));
  return { scope, rows: visible, hiddenCount: rows.length - visible.length };
}

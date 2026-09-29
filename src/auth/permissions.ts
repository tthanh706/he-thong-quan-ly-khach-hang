import type { Role, Scope, ScopeRequest, User } from '../types';
import { ROLE_LABEL, SCOPE_LABEL } from '../types';

/** Nhóm hành động được kiểm soát bởi phân quyền theo vai trò (RBAC) */
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export';

export const ACTION_LABEL: Record<Action, string> = {
  view: 'xem',
  create: 'tạo mới',
  edit: 'chỉnh sửa',
  delete: 'xoá',
  export: 'xuất Excel',
};

/**
 * Ma trận phân quyền theo vai trò.
 * Quyền cấp vai trò chỉ quyết định "được phép làm gì";
 * mọi thao tác đọc/ghi bản ghi còn bị chặn thêm bởi phạm vi dữ liệu sở hữu (Data Scope).
 */
export const PERMISSION_MATRIX: Record<Role, Record<Action, boolean>> = {
  employee: { view: true, create: true, edit: true, delete: false, export: true },
  team_lead: { view: true, create: true, edit: true, delete: true, export: true },
  director: { view: true, create: true, edit: true, delete: true, export: true },
};

/** Phạm vi dữ liệu mặc định của từng vai trò */
export const DEFAULT_SCOPE_BY_ROLE: Record<Role, Scope> = {
  employee: 'own',
  team_lead: 'team',
  director: 'all',
};

/** Các phạm vi mà vai trò được phép chọn trên giao diện */
export const ALLOWED_SCOPES_BY_ROLE: Record<Role, Scope[]> = {
  employee: ['own'],
  team_lead: ['own', 'team'],
  director: ['own', 'team', 'all'],
};

export function can(role: Role, action: Action): boolean {
  return PERMISSION_MATRIX[role][action];
}

export function canAny(role: Role, actions: Action[]): boolean {
  return actions.some((action) => can(role, action));
}

export function describeRole(role: Role): string {
  return `${ROLE_LABEL[role]} · mặc định ${SCOPE_LABEL[DEFAULT_SCOPE_BY_ROLE[role]].toLowerCase()}`;
}

/**
 * Chống nâng quyền: người dùng chỉ được chọn phạm vi mà vai trò cho phép.
 * Yêu cầu ngoài danh sách cho phép sẽ bị hạ về phạm vi mặc định của vai trò.
 */
export function resolveScope(user: User, requested: ScopeRequest = 'auto'): Scope {
  const allowed = ALLOWED_SCOPES_BY_ROLE[user.role];
  if (requested !== 'auto' && allowed.includes(requested)) {
    return requested;
  }
  return DEFAULT_SCOPE_BY_ROLE[user.role];
}

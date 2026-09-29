import type { Customer, EntityName, OwnedRecord, Scope } from '../types';
import { ENTITY_LABEL } from '../types';
import { AccessDeniedError } from '../auth/errors';
import { ACTION_LABEL, can, type Action } from '../auth/permissions';
import {
  buildDeniedError,
  canReadRecord,
  canWriteRecord,
  contextScope,
  filterByScope,
  type RequestContext,
} from '../auth/scope';
import { matchesAllTerms } from '../utils/text';
import { CrmStore, store as defaultStore } from './store';

export interface ListOptions {
  search?: string;
  filters?: Record<string, string | undefined>;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ListResult<T> {
  rows: T[];
  /** Tổng số bản ghi nằm trong phạm vi của người dùng (trước khi tìm kiếm/lọc) */
  totalInScope: number;
  /** Số bản ghi sau khi tìm kiếm + bộ lọc */
  matched: number;
  /** Số bản ghi bị ẩn bởi phân quyền phạm vi */
  hiddenByScope: number;
  scope: Scope;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ScopeStat {
  entity: EntityName;
  label: string;
  total: number;
  visible: number;
  hidden: number;
}

export class NotFoundError extends Error {
  constructor(entity: EntityName, id: string) {
    super(`Không tìm thấy ${ENTITY_LABEL[entity].toLowerCase()} với mã "${id}".`);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends Error {
  constructor(action: Action) {
    super(
      `Tài khoản của bạn không có quyền ${ACTION_LABEL[action]}. `
      + 'Vui lòng liên hệ quản lý nếu cần nâng quyền.',
    );
    this.name = 'PermissionError';
  }
}

const SEARCH_FIELDS: Record<EntityName, string[]> = {
  customer: ['code', 'name', 'industry', 'city', 'phone', 'email', 'status'],
  opportunity: ['code', 'title', 'stage', 'closeDate'],
  activity: ['title', 'type', 'status', 'dueAt'],
  quote: ['code', 'status', 'validUntil'],
};

function isNotEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Lớp truy cập dữ liệu có gắn phân quyền.
 * Mọi lời gọi từ UI đều bắt buộc đi qua đây, nhờ vậy:
 *  - Danh sách, tìm kiếm, xuất Excel dùng chung một hàm lọc theo phạm vi
 *  - Mở trực tiếp bản ghi ngoài phạm vi sẽ ném AccessDeniedError kèm thông báo tiếng Việt
 */
export class ScopedRepository {
  constructor(private readonly store: CrmStore = defaultStore) {}

  /* ------------------------------------------------------------------ */
  /* Đọc                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Truy vấn danh sách. Phạm vi được áp dụng TRƯỚC khi tìm kiếm/bộ lọc/phân trang,
   * nhờ đó kết quả trả về không thể chứa dữ liệu ngoài phạm vi của người dùng.
   */
  list<T extends OwnedRecord>(
    entity: EntityName,
    options: ListOptions,
    ctx: RequestContext,
  ): ListResult<T> {
    const { scope, rows: inScope, hiddenCount } = filterByScope(ctx, this.rows<T>(entity));

    const search = options.search ?? '';
    const filters = options.filters ?? {};
    const searchFields = SEARCH_FIELDS[entity];

    const filtered = inScope.filter((row) => {
      if (isNotEmpty(search)) {
        const blob = searchFields.map((field) => String(row[field as keyof T] ?? '')).join(' ');
        if (!matchesAllTerms(blob, search)) return false;
      }
      return Object.entries(filters).every(([key, value]) => {
        if (!isNotEmpty(value)) return true;
        return String(row[key as keyof T] ?? '') === value;
      });
    });

    const sorted = this.sortRows(filtered, options.sortBy, options.sortDir);

    const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 10;
    const matched = sorted.length;
    const pageCount = Math.max(1, Math.ceil(matched / pageSize));
    const page = Math.min(Math.max(1, options.page ?? 1), pageCount);
    const start = (page - 1) * pageSize;

    return {
      rows: sorted.slice(start, start + pageSize),
      totalInScope: inScope.length,
      matched,
      hiddenByScope: hiddenCount,
      scope,
      page,
      pageSize,
      pageCount,
    };
  }

  /** Lấy tất cả bản ghi trong phạm vi (không phân trang) - dùng cho xuất Excel. */
  exportRows<T extends OwnedRecord>(
    entity: EntityName,
    options: ListOptions,
    ctx: RequestContext,
  ): { rows: T[]; scope: Scope; hiddenByScope: number } {
    const { scope, rows: inScope, hiddenCount } = filterByScope(ctx, this.rows<T>(entity));
    const search = options.search ?? '';
    const filters = options.filters ?? {};
    const searchFields = SEARCH_FIELDS[entity];

    const filtered = inScope.filter((row) => {
      if (isNotEmpty(search)) {
        const blob = searchFields.map((field) => String(row[field as keyof T] ?? '')).join(' ');
        if (!matchesAllTerms(blob, search)) return false;
      }
      return Object.entries(filters).every(([key, value]) => {
        if (!isNotEmpty(value)) return true;
        return String(row[key as keyof T] ?? '') === value;
      });
    });

    return { rows: this.sortRows(filtered, options.sortBy, options.sortDir), scope, hiddenByScope: hiddenCount };
  }

  /** Mở một bản ghi theo id. Ném AccessDeniedError nếu nằm ngoài phạm vi. */
  get<T extends OwnedRecord>(entity: EntityName, id: string, ctx: RequestContext): T {
    this.assertRole(ctx, 'view');
    const record = this.rows<T>(entity).find((row) => row.id === id);
    if (!record) throw new NotFoundError(entity, id);

    if (!canReadRecord(ctx.user, contextScope(ctx), record)) {
      throw buildDeniedError(entity, record, this.metaOf(record), ctx, 'xem');
    }
    return record;
  }

  /** Tra cứu khách hàng nhưng chỉ trong phạm vi - dùng khi hiển thị liên kết liên quan. */
  lookupCustomer(customerId: string, ctx: RequestContext): Customer | undefined {
    const scope = contextScope(ctx);
    const customer = this.store.table('customer').find((row) => row.id === customerId) as
      | Customer
      | undefined;
    if (!customer) return undefined;
    return canReadRecord(ctx.user, scope, customer) ? customer : undefined;
  }

  /* ------------------------------------------------------------------ */
  /* Ghi                                                                */
  /* ------------------------------------------------------------------ */

  /** Tạo bản ghi mới: sở hữu luôn gán cho người đang đăng nhập, không thể chỉ định khác. */
  create<T extends OwnedRecord>(
    entity: EntityName,
    input: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'teamId'>,
    ctx: RequestContext,
  ): T {
    this.assertRole(ctx, 'create');
    const now = new Date().toISOString();
    const id = this.nextId(entity);
    const record = {
      ...input,
      id,
      ownerId: ctx.user.id,
      teamId: ctx.user.teamId,
      createdAt: now,
      updatedAt: now,
    } as T;
    return this.store.insert(entity, record);
  }

  /**
   * Cập nhật bản ghi. Bản ghi ngoài phạm vi sẽ bị chặn bằng thông báo tiếng Việt.
   * Không cho phép chuyển quyền sở hữu (ownerId/teamId là bất biến, kể cả khi gọi API trực tiếp).
   */
  update<T extends OwnedRecord>(
    entity: EntityName,
    id: string,
    patch: Partial<Omit<T, 'id' | 'createdAt' | 'ownerId' | 'teamId'>>,
    ctx: RequestContext,
  ): T {
    this.assertRole(ctx, 'edit');
    const record = this.rows<T>(entity).find((row) => row.id === id);
    if (!record) throw new NotFoundError(entity, id);

    if (!canWriteRecord(ctx.user, contextScope(ctx), record)) {
      throw buildDeniedError(entity, record, this.metaOf(record), ctx, 'chỉnh sửa');
    }

    const safePatch = { ...(patch as Record<string, unknown>) };
    for (const lockedField of ['id', 'ownerId', 'teamId', 'createdAt']) {
      delete safePatch[lockedField];
    }

    const updated = this.store.update(entity, id, safePatch as never);
    if (!updated) throw new NotFoundError(entity, id);
    return updated as T;
  }

  remove(entity: EntityName, id: string, ctx: RequestContext): void {
    this.assertRole(ctx, 'delete');
    const record = this.rows<OwnedRecord>(entity).find((row) => row.id === id);
    if (!record) throw new NotFoundError(entity, id);
    if (!canWriteRecord(ctx.user, contextScope(ctx), record)) {
      throw buildDeniedError(entity, record, this.metaOf(record), ctx, 'xoá');
    }
    this.store.remove(entity, id);
  }

  /* ------------------------------------------------------------------ */
  /* Báo cáo & tiện ích                                                 */
  /* ------------------------------------------------------------------ */

  /** Thống kê số bản ghi hiển thị / bị ẩn theo từng module - phục vụ trang Tổng quan. */
  scopeStats(ctx: RequestContext): ScopeStat[] {
    const entities: EntityName[] = ['customer', 'opportunity', 'activity', 'quote'];
    return entities.map((entity) => {
      const total = this.store.table(entity).length;
      const visible = filterByScope(ctx, this.store.table(entity)).rows.length;
      return {
        entity,
        label: ENTITY_LABEL[entity],
        total,
        visible,
        hidden: total - visible,
      };
    });
  }

  canAction(ctx: RequestContext, action: Action): boolean {
    return can(ctx.user.role, action);
  }

  users() {
    return this.store.users();
  }

  userById(id: string) {
    return this.store.userById(id);
  }

  /** Toàn bộ bản ghi chưa lọc phạm vi - chỉ dùng cho mục đích kiểm thử/đối chiếu nội bộ. */
  allRows<T extends OwnedRecord>(entity: EntityName): T[] {
    return this.rows<T>(entity);
  }

  scopeOf(ctx: RequestContext): Scope {
    return contextScope(ctx);
  }

  metaOf(record: OwnedRecord) {
    return {
      ownerName: this.store.userName(record.ownerId),
      teamName: this.store.teamName(record.teamId),
      title: this.titleOf(record),
    };
  }

  private titleOf(record: OwnedRecord): string {
    const anyRow = record as unknown as Record<string, string>;
    return anyRow.name ?? anyRow.title ?? anyRow.code ?? record.id;
  }

  private assertRole(ctx: RequestContext, action: Action): void {
    if (!can(ctx.user.role, action)) throw new PermissionError(action);
  }

  private rows<T extends OwnedRecord>(entity: EntityName): T[] {
    return this.store.table(entity) as unknown as T[];
  }

  private sortRows<T extends OwnedRecord>(rows: T[], sortBy?: string, sortDir: 'asc' | 'desc' = 'asc'): T[] {
    if (!isNotEmpty(sortBy)) return [...rows];
    const key = sortBy;
    const factor = sortDir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => {
      const left = a[key as keyof T] as unknown as string | number;
      const right = b[key as keyof T] as unknown as string | number;
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor;
      return String(left ?? '').localeCompare(String(right ?? ''), 'vi') * factor;
    });
  }

  private nextId(entity: EntityName): string {
    const prefix: Record<EntityName, string> = {
      customer: 'C',
      opportunity: 'O',
      activity: 'A',
      quote: 'Q',
    };
    const next = this.store.table(entity).length + 1;
    return `${prefix[entity]}${Date.now().toString(36).toUpperCase().slice(-4)}${next}`;
  }
}

export const repository = new ScopedRepository(defaultStore);

export function isAccessDeniedError(error: unknown): error is AccessDeniedError {
  return error instanceof AccessDeniedError;
}

import { beforeEach, describe, expect, it } from 'vitest';
import { CrmStore } from '../services/store';
import { PermissionError, ScopedRepository } from '../services/repository';
import {
  ALLOWED_SCOPES_BY_ROLE,
  DEFAULT_SCOPE_BY_ROLE,
  can,
  resolveScope,
} from '../auth/permissions';
import type { RequestContext } from '../auth/scope';
import { canReadRecord, canWriteRecord, contextScope, filterByScope } from '../auth/scope';
import type { Customer, User } from '../types';

const EMPLOYEE_A = 'U1';
const EMPLOYEE_B = 'U2';
const TEAM_LEAD = 'U3';
const OTHER_TEAM_EMPLOYEE = 'U4';
const DIRECTOR = 'U5';
const CUSTOMER_OF_A = 'C1';
const CUSTOMER_OF_B = 'C3';

let repo: ScopedRepository;

function user(id: string): User {
  const found = repo.userById(id);
  if (!found) throw new Error(`Không có tài khoản ${id}`);
  return found;
}

function ctx(id: string, scope?: RequestContext['scopeRequest']): RequestContext {
  return { user: user(id), scopeRequest: scope };
}

beforeEach(() => {
  repo = new ScopedRepository(new CrmStore());
});

describe('Phạm vi dữ liệu theo vai trò', () => {
  it('mỗi vai trò có phạm vi mặc định đúng mô tả nghiệm thu', () => {
    expect(DEFAULT_SCOPE_BY_ROLE.employee).toBe('own');
    expect(DEFAULT_SCOPE_BY_ROLE.team_lead).toBe('team');
    expect(DEFAULT_SCOPE_BY_ROLE.director).toBe('all');
  });

  it('trưởng nhóm thấy dữ liệu của cả nhóm nhưng không thấy nhóm khác', () => {
    const result = repo.list<Customer>('customer', { pageSize: 100 }, ctx(TEAM_LEAD));
    const ids = result.rows.map((row) => row.id);

    expect(ids).toEqual(['C1', 'C2', 'C3', 'C6']);
    expect(ids).toContain(CUSTOMER_OF_A);
    expect(ids).toContain(CUSTOMER_OF_B);
    expect(ids).not.toContain('C4'); // Nhóm T2
    expect(ids).not.toContain('C5'); // Nhóm T3
  });

  it('trưởng nhóm có thể thu hẹp về dữ liệu của chính mình', () => {
    const result = repo.list<Customer>('customer', { pageSize: 100 }, ctx(TEAM_LEAD, 'own'));
    expect(result.scope).toBe('own');
    expect(result.rows.every((row) => row.ownerId === TEAM_LEAD)).toBe(true);
  });

  it('giám đốc thấy toàn bộ dữ liệu của công ty', () => {
    const customers = repo.list('customer', { pageSize: 100 }, ctx(DIRECTOR));
    const opportunities = repo.list('opportunity', { pageSize: 100 }, ctx(DIRECTOR));
    const activities = repo.list('activity', { pageSize: 100 }, ctx(DIRECTOR));
    const quotes = repo.list('quote', { pageSize: 100 }, ctx(DIRECTOR));

    expect(customers.matched).toBe(7);
    expect(opportunities.matched).toBe(6);
    expect(activities.matched).toBe(6);
    expect(quotes.matched).toBe(6);
    expect(customers.hiddenByScope).toBe(0);
  });

  it('giám đốc vẫn có thể chọn phạm vi hẹp hơn', () => {
    const ownOnly = repo.list<Customer>('customer', { pageSize: 100 }, ctx(DIRECTOR, 'own'));
    expect(ownOnly.scope).toBe('own');
    expect(ownOnly.rows.every((row) => row.ownerId === DIRECTOR)).toBe(true);
  });

  it('nhân viên của nhóm khác không thấy dữ liệu của nhóm này', () => {
    const ids = repo
      .list<Customer>('customer', { pageSize: 100 }, ctx(OTHER_TEAM_EMPLOYEE))
      .rows.map((row) => row.id);

    expect(ids).toEqual(['C4', 'C7']);
    expect(ids).not.toContain(CUSTOMER_OF_A);
    expect(ids).not.toContain(CUSTOMER_OF_B);
  });
});

describe('Chống nâng quyền (privilege escalation)', () => {
  it('nhân viên yêu cầu phạm vi team/all bị hạ về phạm vi own', () => {
    expect(resolveScope(user(EMPLOYEE_A), 'all')).toBe('own');
    expect(resolveScope(user(EMPLOYEE_A), 'team')).toBe('own');
    expect(resolveScope(user(EMPLOYEE_A), 'auto')).toBe('own');
  });

  it('trưởng nhóm không thể chọn phạm vi toàn bộ', () => {
    expect(resolveScope(user(TEAM_LEAD), 'all')).toBe('team');
    expect(ALLOWED_SCOPES_BY_ROLE.team_lead).toEqual(['own', 'team']);
  });

  it('vượt phạm vi bằng tham số vẫn không lộ dữ liệu qua API', () => {
    const result = repo.list<Customer>('customer', { pageSize: 100 }, ctx(EMPLOYEE_A, 'all'));
    expect(result.scope).toBe('own');
    expect(result.rows.map((row) => row.id)).not.toContain(CUSTOMER_OF_B);
  });

  it('quyền xoá bản ghi chỉ dành cho trưởng nhóm và giám đốc', () => {
    expect(can('employee', 'delete')).toBe(false);
    expect(can('team_lead', 'delete')).toBe(true);
    expect(can('director', 'delete')).toBe(true);
    expect(() => repo.remove('customer', CUSTOMER_OF_A, ctx(EMPLOYEE_A))).toThrowError(PermissionError);
  });

  it('thông báo PermissionError bằng tiếng Việt', () => {
    try {
      repo.remove('customer', CUSTOMER_OF_A, ctx(EMPLOYEE_A));
      expect.unreachable('Nhân viên không được xoá');
    } catch (error) {
      expect((error as Error).message).toContain('không có quyền');
    }
  });

  it('bản ghi tạo mới luôn thuộc sở hữu người đang đăng nhập', () => {
    const created = repo.create<Customer>(
      'customer',
      {
        code: 'KH-NEW',
        name: 'Khách hàng mới',
        industry: 'Dịch vụ',
        city: 'Hà Nội',
        phone: '024 0000 0000',
        email: 'new@crm.vn',
        status: 'lead',
      },
      ctx(EMPLOYEE_A),
    );

    expect(created.ownerId).toBe(EMPLOYEE_A);
    expect(created.teamId).toBe(user(EMPLOYEE_A).teamId);
    expect(repo.list<Customer>('customer', { pageSize: 100 }, ctx(EMPLOYEE_B)).rows.map((row) => row.id))
      .not.toContain(created.id);
  });

  it('không thể đổi quyền sở hữu khi cập nhật bản ghi', () => {
    const before = repo.get<Customer>('customer', CUSTOMER_OF_A, ctx(EMPLOYEE_A));
    const patch = { ownerId: EMPLOYEE_B } as unknown as { name: string };
    const after = repo.update<Customer>('customer', CUSTOMER_OF_A, patch, ctx(EMPLOYEE_A));

    expect(after.ownerId).toBe(before.ownerId);
    expect(after.ownerId).toBe(EMPLOYEE_A);
  });
});

describe('Hàm phạm vi dữ liệu cấp thấp', () => {
  it('canReadRecord / canWriteRecord theo đúng quan hệ sở hữu', () => {
    const employee = user(EMPLOYEE_A);
    const record = repo.get<Customer>('customer', CUSTOMER_OF_B, ctx(EMPLOYEE_B));

    expect(canReadRecord(employee, 'own', record)).toBe(false);
    expect(canReadRecord(employee, 'team', record)).toBe(true);
    expect(canReadRecord(employee, 'all', record)).toBe(true);
    expect(canReadRecord(employee, 'own', { ...record, ownerId: EMPLOYEE_A })).toBe(true);
    expect(canWriteRecord(employee, 'own', record)).toBe(false);
  });

  it('filterByScope trả về số bản ghi bị ẩn', () => {
    const all = repo.allRows<Customer>('customer');
    const { rows, hiddenCount, scope } = filterByScope(ctx(EMPLOYEE_A), all);

    expect(scope).toBe('own');
    expect(rows).toHaveLength(2);
    expect(hiddenCount).toBe(5);
  });

  it('contextScope mặc định lấy phạm vi theo vai trò', () => {
    expect(contextScope({ user: user(EMPLOYEE_A) })).toBe('own');
    expect(contextScope({ user: user(TEAM_LEAD) })).toBe('team');
    expect(contextScope({ user: user(DIRECTOR) })).toBe('all');
  });
});

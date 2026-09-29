import { beforeEach, describe, expect, it } from 'vitest';
import { CrmStore } from '../services/store';
import { ScopedRepository } from '../services/repository';
import { AccessDeniedError, isAccessDenied } from '../auth/errors';
import type { RequestContext } from '../auth/scope';
import type { Customer } from '../types';

const EMPLOYEE_A_ID = 'U1'; // Nguyễn Minh Anh - Nhóm Bán hàng Miền Bắc (T1)
const EMPLOYEE_B_ID = 'U2'; // Trần Thu Hà - cùng nhóm T1 nhưng KHÁC dữ liệu
const CUSTOMER_OF_B = 'C3'; // Tập đoàn Hoàng Gia - sở hữu bởi nhân viên B
const CUSTOMER_OF_A = 'C1'; // Công ty Cổ phần Minh Khai - sở hữu bởi nhân viên A
const OPPORTUNITY_OF_B = 'O3';
const ACTIVITY_OF_B = 'A3';
const QUOTE_OF_B = 'Q3';

let repo: ScopedRepository;

function employeeA(): RequestContext {
  return { user: repo.userById(EMPLOYEE_A_ID)!, scopeRequest: 'auto' };
}

function employeeB(): RequestContext {
  return { user: repo.userById(EMPLOYEE_B_ID)!, scopeRequest: 'auto' };
}

beforeEach(() => {
  repo = new ScopedRepository(new CrmStore());
});

describe('SCRUM-5 · Cách ly dữ liệu giữa nhân viên A và nhân viên B', () => {
  it('nhân viên A không đọc được khách hàng của nhân viên B', () => {
    expect(() => repo.get<Customer>('customer', CUSTOMER_OF_B, employeeA())).toThrowError(AccessDeniedError);

    try {
      repo.get<Customer>('customer', CUSTOMER_OF_B, employeeA());
      expect.unreachable('Phải bị chặn khi đọc bản ghi ngoài phạm vi');
    } catch (error) {
      expect(isAccessDenied(error)).toBe(true);
      const denied = error as AccessDeniedError;
      expect(denied.entity).toBe('customer');
      expect(denied.recordId).toBe(CUSTOMER_OF_B);
      expect(denied.scope).toBe('own');
      expect(denied.recordOwnerName).toBe(repo.userById(EMPLOYEE_B_ID)?.name);
    }
  });

  it('thông báo từ chối bằng tiếng Việt, nêu rõ phạm vi và chủ sở hữu bản ghi', () => {
    let message = '';
    try {
      repo.get<Customer>('customer', CUSTOMER_OF_B, employeeA());
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('Không có quyền');
    expect(message).toContain('khách hàng');
    expect(message).toContain(CUSTOMER_OF_B);
    expect(message).toContain('Dữ liệu của tôi');
    expect(message).toContain(repo.userById(EMPLOYEE_B_ID)?.name ?? '');
    expect(message).toContain('liên hệ');
  });

  it('nhân viên B vẫn đọc được khách hàng của chính mình', () => {
    const customer = repo.get<Customer>('customer', CUSTOMER_OF_B, employeeB());
    expect(customer.id).toBe(CUSTOMER_OF_B);
    expect(customer.ownerId).toBe(EMPLOYEE_B_ID);
  });

  it('danh sách của A chỉ chứa bản ghi của chính A', () => {
    const result = repo.list<Customer>('customer', { pageSize: 100 }, employeeA());

    expect(result.rows.map((row) => row.id)).toEqual([CUSTOMER_OF_A, 'C2']);
    expect(result.rows.every((row) => row.ownerId === EMPLOYEE_A_ID)).toBe(true);
    expect(result.totalInScope).toBe(2);
    expect(result.hiddenByScope).toBe(5);
    expect(result.scope).toBe('own');
  });

  it('tìm kiếm của A không tìm thấy khách hàng của B', () => {
    const result = repo.list<Customer>('customer', { search: 'Hoàng Gia', pageSize: 100 }, employeeA());

    expect(result.matched).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('tìm kiếm không phân biệt dấu vẫn bị chặn với A nhưng B thì tìm thấy', () => {
    const asA = repo.list<Customer>('customer', { search: 'hoang gia', pageSize: 100 }, employeeA());
    const asB = repo.list<Customer>('customer', { search: 'hoang gia', pageSize: 100 }, employeeB());

    expect(asA.matched).toBe(0);
    expect(asB.matched).toBe(1);
    expect(asB.rows[0]?.id).toBe(CUSTOMER_OF_B);
  });

  it('dữ liệu xuất Excel của A không chứa khách hàng của B', () => {
    const { rows, hiddenByScope } = repo.exportRows<Customer>('customer', {}, employeeA());

    expect(rows.map((row) => row.id)).not.toContain(CUSTOMER_OF_B);
    expect(rows.every((row) => row.ownerId === EMPLOYEE_A_ID)).toBe(true);
    expect(hiddenByScope).toBe(5);
  });

  it('nhân viên A không sửa được khách hàng của B', () => {
    expect(() => repo.update<Customer>('customer', CUSTOMER_OF_B, { name: 'Cố sửa' }, employeeA()))
      .toThrowError(AccessDeniedError);
    expect(repo.get<Customer>('customer', CUSTOMER_OF_B, employeeB()).name).not.toBe('Cố sửa');
  });

  it('nhân viên A không xoá được khách hàng của B', () => {
    expect(() => repo.remove('customer', CUSTOMER_OF_B, employeeA())).toThrow();
    expect(repo.get<Customer>('customer', CUSTOMER_OF_B, employeeB()).id).toBe(CUSTOMER_OF_B);
  });

  it('trưởng nhóm có quyền xoá nhưng vẫn bị chặn khi bản ghi thuộc nhóm khác', () => {
    const teamLead = { user: repo.userById('U3')!, scopeRequest: 'auto' as const };

    expect(() => repo.remove('customer', 'C4', teamLead)).toThrowError(AccessDeniedError);
    expect(() => repo.remove('customer', 'C3', teamLead)).not.toThrow();
  });

  it('cơ hội, hoạt động và báo giá của B cũng bị ẩn khỏi A', () => {
    const opportunities = repo.list('opportunity', { pageSize: 100 }, employeeA());
    const activities = repo.list('activity', { pageSize: 100 }, employeeA());
    const quotes = repo.list('quote', { pageSize: 100 }, employeeA());

    expect(opportunities.rows.every((row) => row.ownerId === EMPLOYEE_A_ID)).toBe(true);
    expect(activities.rows.every((row) => row.ownerId === EMPLOYEE_A_ID)).toBe(true);
    expect(quotes.rows.every((row) => row.ownerId === EMPLOYEE_A_ID)).toBe(true);

    const ids = [
      ...opportunities.rows.map((row) => row.id),
      ...activities.rows.map((row) => row.id),
      ...quotes.rows.map((row) => row.id),
    ];
    expect(ids).not.toContain(OPPORTUNITY_OF_B);
    expect(ids).not.toContain(ACTIVITY_OF_B);
    expect(ids).not.toContain(QUOTE_OF_B);
  });

  it('bản ghi liên quan ngoài phạm vi không lộ tên qua tra cứu', () => {
    expect(repo.lookupCustomer(CUSTOMER_OF_B, employeeA())).toBeUndefined();
    expect(repo.lookupCustomer(CUSTOMER_OF_B, employeeB())?.name).toContain('Hoàng Gia');
  });

  it('thống kê tổng quan không lộ dữ liệu ngoài phạm vi', () => {
    const stats = repo.scopeStats(employeeA());
    const customers = stats.find((item) => item.entity === 'customer');

    expect(customers?.visible).toBe(2);
    expect(customers?.hidden).toBe(5);
    expect(customers?.total).toBe(7);
  });
});

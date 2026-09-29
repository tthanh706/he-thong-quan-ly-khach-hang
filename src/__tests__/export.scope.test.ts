import { beforeEach, describe, expect, it } from 'vitest';
import { CrmStore } from '../services/store';
import { ScopedRepository } from '../services/repository';
import { toCsv } from '../utils/exportExcel';
import { runIsolationChecks } from '../checks/isolation';
import type { RequestContext } from '../auth/scope';
import type { Customer, Opportunity } from '../types';

let repo: ScopedRepository;

function ctx(id: string, scope?: RequestContext['scopeRequest']): RequestContext {
  return { user: repo.userById(id)!, scopeRequest: scope };
}

beforeEach(() => {
  repo = new ScopedRepository(new CrmStore());
});

describe('Tìm kiếm và xuất Excel cũng phải tôn trọng phạm vi', () => {
  it('xuất Excel của nhân viên chỉ gồm dữ liệu của chính nhân viên', () => {
    const { rows, scope, hiddenByScope } = repo.exportRows<Customer>('customer', {}, ctx('U1'));

    expect(scope).toBe('own');
    expect(hiddenByScope).toBe(5);
    expect(rows.map((row) => row.code)).toEqual(['KH-001', 'KH-002']);
  });

  it('nội dung file CSV không chứa mã của bản ghi ngoài phạm vi', () => {
    const { rows } = repo.exportRows<Customer>('customer', {}, ctx('U1'));
    const csv = toCsv(rows, [
      { header: 'Mã', value: (row) => row.code },
      { header: 'Tên', value: (row) => row.name },
    ]);

    expect(csv).toContain('KH-001');
    expect(csv).not.toContain('KH-003');
    expect(csv).not.toContain('Hoàng Gia');
  });

  it('xuất Excel theo phạm vi của trưởng nhóm gồm cả bản ghi của đồng nghiệp', () => {
    const { rows, scope } = repo.exportRows<Customer>('customer', {}, ctx('U3'));

    expect(scope).toBe('team');
    expect(rows.map((row) => row.code)).toContain('KH-003');
  });

  it('giám đốc xuất được toàn bộ khách hàng', () => {
    const { rows, hiddenByScope } = repo.exportRows<Customer>('customer', {}, ctx('U5'));

    expect(rows).toHaveLength(7);
    expect(hiddenByScope).toBe(0);
  });

  it('xuất Excel có tôn trọng từ khoá tìm kiếm đang dùng', () => {
    const { rows } = repo.exportRows<Opportunity>('opportunity', { search: 'crm' }, ctx('U1'));

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.ownerId === 'U1')).toBe(true);
  });

  it('CSV escape đúng với dữ liệu chứa dấu phẩy và dấu nháy kép', () => {
    const csv = toCsv([{ note: 'Có, dấu "phẩy"' }], [{ header: 'Ghi chú', value: (row) => row.note }]);
    expect(csv).toContain('"Có, dấu ""phẩy"""');
  });
});

describe('Bộ kiểm thử cách ly dữ liệu dùng chung với giao diện', () => {
  it('tất cả kịch bản kiểm thử đều đạt', () => {
    const results = runIsolationChecks(new ScopedRepository(new CrmStore()));
    const failed = results.filter((item) => !item.passed);

    expect(failed.map((item) => item.title)).toEqual([]);
    expect(results.length).toBeGreaterThanOrEqual(10);
  });

  it('có kịch bản chứng minh nhân viên A không đọc được khách hàng của nhân viên B', () => {
    const results = runIsolationChecks(new ScopedRepository(new CrmStore()));
    const target = results.find((item) => item.id === 'A-khong-doc-duoc-khach-cua-B');

    expect(target).toBeDefined();
    expect(target?.passed).toBe(true);
    expect(target?.detail).toContain('Không có quyền');
  });

  it('mỗi kết quả đều kèm yêu cầu nghiệm thu bằng tiếng Việt', () => {
    for (const result of runIsolationChecks(new ScopedRepository(new CrmStore()))) {
      expect(result.title.length).toBeGreaterThan(10);
      expect(result.requirement.length).toBeGreaterThan(5);
      expect(result.detail.length).toBeGreaterThan(5);
    }
  });
});

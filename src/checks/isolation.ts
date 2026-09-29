import { CrmStore } from '../services/store';
import { PermissionError, ScopedRepository } from '../services/repository';
import { AccessDeniedError, isAccessDenied } from '../auth/errors';
import { can, resolveScope } from '../auth/permissions';
import type { RequestContext } from '../auth/scope';
import { filterByScope } from '../auth/scope';
import { toCsv } from '../utils/exportExcel';
import type { Customer, User } from '../types';

export interface CheckResult {
  id: string;
  title: string;
  requirement: string;
  passed: boolean;
  detail: string;
}

/** Ngữ cảnh của từng tài khoản mẫu dùng cho kiểm thử (tương ứng với src/data/seed.ts) */
export function buildFixtures(repo: ScopedRepository): {
  employeeA: User;
  employeeB: User;
  teamLead: User;
  otherTeamEmployee: User;
  director: User;
  ctx: (user: User, scope?: RequestContext['scopeRequest']) => RequestContext;
} {
  const users = repo.users();

  const employeeA = findUser(users, 'U1');
  const employeeB = findUser(users, 'U2');
  const teamLead = findUser(users, 'U3');
  const otherTeamEmployee = findUser(users, 'U4');
  const director = findUser(users, 'U5');

  return {
    employeeA,
    employeeB,
    teamLead,
    otherTeamEmployee,
    director,
    ctx: (user, scope) => ({ user, scopeRequest: scope }),
  };
}

function findUser(users: User[], id: string): User {
  const user = users.find((item) => item.id === id);
  if (!user) throw new Error(`Không tìm thấy tài khoản mẫu ${id} trong dữ liệu seed.`);
  return user;
}

function deniedBy(repo: ScopedRepository, entity: 'customer' | 'opportunity' | 'activity' | 'quote', id: string, ctx: RequestContext): AccessDeniedError | null {
  try {
    repo.get(entity, id, ctx);
    return null;
  } catch (error) {
    return isAccessDenied(error) ? error : null;
  }
}

function passes(id: string, title: string, requirement: string, condition: boolean, detail: string): CheckResult {
  return { id, title, requirement, passed: condition, detail };
}

/**
 * Bộ kiểm thử phân quyền chạy được cả trong Vitest lẫn ngay trên trình duyệt
 * (trang "Kiểm thử phân quyền"), bảo đảm tiêu chí nghiệm thu được kiểm chứng tự động.
 */
export function runIsolationChecks(target: ScopedRepository = new ScopedRepository(new CrmStore())): CheckResult[] {
  const repo = target;
  const { employeeA, employeeB, teamLead, otherTeamEmployee, director, ctx } = buildFixtures(repo);

  const results: CheckResult[] = [];

  /* 1. Nhân viên A không mở được bản ghi của nhân viên B */
  const denied = deniedBy(repo, 'customer', 'C3', ctx(employeeA));
  results.push(passes(
    'A-khong-doc-duoc-khach-cua-B',
    'Nhân viên A không đọc được khách hàng của nhân viên B',
    'Truy cập bản ghi ngoài phạm vi hiển thị thông báo tiếng Việt rõ ràng',
    denied !== null && denied.message.includes('Không có quyền') && denied.message.includes(employeeB.name),
    denied
      ? `Từ chối đúng: "${denied.message}"`
      : 'NGUY HIỂM: nhân viên A đọc được khách hàng của nhân viên B!',
  ));

  /* 2. Danh sách của A chỉ có dữ liệu của A */
  const customersOfA = repo.list('customer', { pageSize: 100 }, ctx(employeeA));
  const idsOfA = customersOfA.rows.map((row) => row.id);
  results.push(passes(
    'danh-sach-khach-hang-A',
    'Danh sách khách hàng của A không chứa khách hàng của B',
    'Mọi truy vấn danh sách tự động lọc theo phạm vi',
    !idsOfA.includes('C3') && customersOfA.rows.every((row) => row.ownerId === employeeA.id),
    `A thấy ${customersOfA.matched}/${customersOfA.totalInScope} bản ghi trong phạm vi, ${customersOfA.hiddenByScope} bản ghi bị ẩn (mã: ${idsOfA.join(', ') || 'không có'})`,
  ));

  /* 3. Tìm kiếm cũng bị lọc theo phạm vi */
  const searchA = repo.list('customer', { search: 'Hoàng Gia', pageSize: 100 }, ctx(employeeA));
  const searchB = repo.list('customer', { search: 'hoang gia', pageSize: 100 }, ctx(employeeB));
  results.push(passes(
    'tim-kiem-khong-lo-du-lieu',
    'Tìm kiếm tên khách hàng của B từ tài khoản A không trả về kết quả',
    'Kể cả tìm kiếm cũng phải lọc theo phạm vi',
    searchA.matched === 0 && searchB.matched === 1,
    `A tìm "Hoàng Gia" → ${searchA.matched} kết quả; B tìm "hoang gia" (không dấu) → ${searchB.matched} kết quả`,
  ));

  /* 4. Xuất Excel không rò rỉ dữ liệu */
  const exportA = repo.exportRows<Customer>('customer', {}, ctx(employeeA));
  const csv = toCsv(exportA.rows, [{ header: 'Mã', value: (row) => row.code }]);
  results.push(passes(
    'xuat-excel-khong-ro-ri',
    'File Excel xuất ra không chứa dữ liệu ngoài phạm vi',
    'Kể cả xuất Excel cũng phải lọc theo phạm vi',
    !exportA.rows.some((row) => row.id === 'C3') && !csv.includes('KH-003'),
    `A xuất ${exportA.rows.length} dòng, ${exportA.hiddenByScope} dòng bị loại khỏi file (mã xuất: ${exportA.rows.map((row) => row.code).join(', ')})`,
  ));

  /* 5. Trưởng nhóm thấy toàn nhóm */
  const customersOfLead = repo.list('customer', { pageSize: 100 }, ctx(teamLead));
  const leadIds = customersOfLead.rows.map((row) => row.id);
  results.push(passes(
    'truong-nhom-thay-toan-nhom',
    'Trưởng nhóm thấy toàn bộ dữ liệu của nhóm nhưng không thấy nhóm khác',
    'Trưởng nhóm xem được phạm vi "của nhóm tôi"',
    leadIds.includes('C1') && leadIds.includes('C3') && !leadIds.includes('C4') && !leadIds.includes('C5'),
    `Trưởng nhóm ${teamLead.name} thấy ${leadIds.join(', ')} — không có KH-004 (nhóm khác)`,
  ));

  /* 6. Giám đốc thấy tất cả */
  const customersOfDirector = repo.list('customer', { pageSize: 100 }, ctx(director));
  const total = repo.scopeStats(ctx(director)).find((item) => item.entity === 'customer')?.total ?? 0;
  results.push(passes(
    'giam-doc-thay-tat-ca',
    'Giám đốc kinh doanh thấy toàn bộ khách hàng',
    'Phạm vi "tất cả" cho vai trò giám đốc',
    customersOfDirector.matched === total && total > 0,
    `Giám đốc thấy ${customersOfDirector.matched}/${total} khách hàng`,
  ));

  /* 7. Ba module còn lại cũng bị lọc */
  const others = (['opportunity', 'activity', 'quote'] as const).map((entity) => {
    const rows = repo.list(entity, { pageSize: 100 }, ctx(employeeA)).rows;
    return rows.every((row) => row.ownerId === employeeA.id);
  });
  results.push(passes(
    'ba-module-con-lai-duoc-loc',
    'Cơ hội, hoạt động, báo giá của B đều bị ẩn khỏi A',
    'Ba phạm vi dữ liệu áp dụng cho cả 4 module',
    others.every(Boolean),
    'Kiểm tra tự động cho cơ hội, hoạt động và báo giá đều không lộ bản ghi của nhân viên khác',
  ));

  /* 8. Nhân viên khác nhóm cũng không thấy dữ liệu của A */
  const otherTeam = repo.list('customer', { pageSize: 100 }, ctx(otherTeamEmployee));
  const otherTeamIds = otherTeam.rows.map((row) => row.id);
  results.push(passes(
    'khong-ro-sang-nhom-khac',
    'Nhân viên nhóm khác không thấy khách hàng của nhóm này',
    'Phạm vi "của tôi" không vượt qua ranh giới nhóm',
    !otherTeamIds.includes('C1') && !otherTeamIds.includes('C3') && otherTeam.rows.every((row) => row.ownerId === otherTeamEmployee.id),
    `${otherTeamEmployee.name} thấy ${otherTeamIds.join(', ') || 'không có bản ghi nào ngoài phạm vi'}`,
  ));

  /* 9. Không thể nâng quyền bằng tham số */
  results.push(passes(
    'khong-the-nang-quyen',
    'Nhân viên không thể tự nâng phạm vi lên "tất cả"',
    'Phân quyền theo vai trò chống nâng quyền',
    resolveScope(employeeA, 'all') === 'own' && resolveScope(employeeA, 'team') === 'own' && resolveScope(director, 'own') === 'own',
    `Yêu cầu scope=all từ tài khoản nhân viên → bị hạ về "${resolveScope(employeeA, 'all')}"; giám đốc tự thu hẹp về "own" vẫn được phép`,
  ));

  /* 10. Không chỉnh sửa được bản ghi của người khác trong phạm vi hẹp */
  let editDenied = false;
  try {
    repo.update<Customer>('customer', 'C3', { name: 'Cố sửa' }, ctx(employeeA));
  } catch (error) {
    editDenied = isAccessDenied(error);
  }
  results.push(passes(
    'khong-sua-duoc-ban-ghi-nguoi-khac',
    'Nhân viên A không sửa được khách hàng của nhân viên B',
    'Quyền ghi cũng bị giới hạn bởi phạm vi sở hữu',
    editDenied,
    editDenied ? 'Cập nhật bị chặn bằng thông báo tiếng Việt' : 'NGUY HIỂM: nhân viên A sửa được dữ liệu của B!',
  ));

  /* 11. Bản ghi mới luôn thuộc sở hữu người tạo */
  const created = repo.create('customer', {
    code: 'KH-TEST',
    name: 'Khách hàng kiểm thử',
    industry: 'Kiểm thử',
    city: 'Hà Nội',
    phone: '024 0000 0001',
    email: 'test@crm.vn',
    status: 'lead',
  }, ctx(employeeA));
  results.push(passes(
    'ban-ghi-moi-thuoc-so-hu-nguoi-tao',
    'Bản ghi mới luôn được gán sở hữu cho người tạo',
    'Không thể tự gán sở hữu bản ghi cho người khác',
    created.ownerId === employeeA.id && created.teamId === employeeA.teamId,
    `Bản ghi ${created.id} có ownerId=${created.ownerId}, teamId=${created.teamId}`,
  ));

  /* 12. Quyền theo vai trò (xoá) */
  let deleteDenied = false;
  try {
    repo.remove('customer', 'C1', ctx(employeeA));
  } catch (error) {
    deleteDenied = error instanceof PermissionError;
  }
  results.push(passes(
    'nhan-vien-khong-xoa-duoc',
    'Nhân viên không được xoá bản ghi (quyền theo vai trò)',
    'Phân quyền theo vai trò bổ trợ cho phân quyền dữ liệu',
    deleteDenied && can(teamLead.role, 'delete'),
    deleteDenied
      ? 'Hệ thống trả về PermissionError tiếng Việt cho nhân viên, trưởng nhóm vẫn có quyền xoá'
      : 'NGUY HIỂM: nhân viên xoá được bản ghi!',
  ));

  /* 13. Thống kê phạm vi khớp với danh sách */
  const statCustomer = repo.scopeStats(ctx(employeeA)).find((item) => item.entity === 'customer');
  const scopeRows = filterByScope(ctx(employeeA), repo.allRows('customer')).rows;
  results.push(passes(
    'thong-ke-pham-vi-khop-danh-sach',
    'Số liệu thống kê trên tổng quan khớp với danh sách được lọc',
    'Không rò rỉ số liệu qua báo cáo tổng quan',
    Boolean(statCustomer) && statCustomer?.visible === scopeRows.length,
    `Thống kê hiển thị ${statCustomer?.visible} khách hàng, danh sách trả về ${scopeRows.length}`,
  ));

  return results;
}

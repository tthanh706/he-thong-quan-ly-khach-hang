/**
 * SCRUM-5 / SCRUM-89 - Phân quyền theo vai trò (RBAC) và theo dữ liệu sở hữu (Data Scope)
 * Kiểu dữ liệu dùng chung cho toàn hệ thống.
 */

/** Vai trò trong hệ thống */
export type Role = 'employee' | 'team_lead' | 'director';

/** Phạm vi dữ liệu: của tôi / của nhóm tôi / tất cả */
export type Scope = 'own' | 'team' | 'all';

/** Yêu cầu phạm vi từ UI: 'auto' = dùng mặc định theo vai trò */
export type ScopeRequest = Scope | 'auto';

/** 4 module nghiệp vụ được áp dụng phân quyền */
export type EntityName = 'customer' | 'opportunity' | 'activity' | 'quote';

export const ENTITY_NAMES: EntityName[] = ['customer', 'opportunity', 'activity', 'quote'];

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  title: string;
  role: Role;
  teamId: string;
  avatarColor: string;
}

/** Trường bắt buộc của mọi bản ghi phân quyền theo dữ liệu sở hữu */
export interface OwnedRecord {
  id: string;
  /** Người sở hữu bản ghi (người tạo) */
  ownerId: string;
  /** Nhóm của người sở hữu tại thời điểm tạo - dùng cho phạm vi "của nhóm tôi" */
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'lead' | 'active' | 'inactive';

export interface Customer extends OwnedRecord {
  code: string;
  name: string;
  industry: string;
  city: string;
  phone: string;
  email: string;
  status: CustomerStatus;
}

export type OpportunityStage =
  | 'prospecting'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Opportunity extends OwnedRecord {
  code: string;
  title: string;
  customerId: string;
  amount: number;
  stage: OpportunityStage;
  closeDate: string;
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'visit';
export type ActivityStatus = 'todo' | 'done' | 'overdue';

export interface Activity extends OwnedRecord {
  title: string;
  type: ActivityType;
  customerId: string;
  assigneeId: string;
  dueAt: string;
  status: ActivityStatus;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Quote extends OwnedRecord {
  code: string;
  customerId: string;
  opportunityId: string;
  amount: number;
  validUntil: string;
  status: QuoteStatus;
}

/** Bản ghi có nhãn tiếng Việt để hiển thị thông báo lỗi */
export const ENTITY_LABEL: Record<EntityName, string> = {
  customer: 'Khách hàng',
  opportunity: 'Cơ hội',
  activity: 'Hoạt động',
  quote: 'Báo giá',
};

export const ROLE_LABEL: Record<Role, string> = {
  employee: 'Nhân viên kinh doanh',
  team_lead: 'Trưởng nhóm',
  director: 'Giám đốc kinh doanh',
};

export const SCOPE_LABEL: Record<Scope, string> = {
  own: 'Dữ liệu của tôi',
  team: 'Dữ liệu của nhóm tôi',
  all: 'Toàn bộ dữ liệu',
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  lead: 'Tiềm năng',
  active: 'Đang phục vụ',
  inactive: 'Ngừng hoạt động',
};

export const STAGE_LABEL: Record<OpportunityStage, string> = {
  prospecting: 'Tìm kiếm',
  qualified: 'Đã xác định',
  proposal: 'Đề xuất',
  negotiation: 'Đàm phán',
  won: 'Thắng',
  lost: 'Thua',
};

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: 'Cuộc gọi',
  meeting: 'Cuộc họp',
  email: 'Email',
  visit: 'Thăm khách',
};

export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  todo: 'Chờ xử lý',
  done: 'Đã hoàn thành',
  overdue: 'Quá hạn',
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  accepted: 'Đã chấp nhận',
  rejected: 'Bị từ chối',
};

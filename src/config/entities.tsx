import type { ReactNode } from 'react';
import type {
  Activity,
  ActivityType,
  Customer,
  EntityName,
  Opportunity,
  OwnedRecord,
  Quote,
} from '../types';
import {
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_TYPE_LABEL,
  CUSTOMER_STATUS_LABEL,
  QUOTE_STATUS_LABEL,
  STAGE_LABEL,
} from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { Badge, type BadgeTone } from '../components/Badge';

export interface RowHelpers {
  ownerName: (id: string) => string;
  teamName: (id: string) => string;
  customerName: (customerId: string) => string;
  isCustomerVisible: (customerId: string) => boolean;
}

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, helpers: RowHelpers) => ReactNode;
  exportValue?: (row: T, helpers: RowHelpers) => string | number;
}

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DetailField {
  label: string;
  value: string;
  muted?: boolean;
}

export type DraftOf<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'teamId'>;

export interface EntityConfig<T extends OwnedRecord> {
  entity: EntityName;
  label: string;
  route: string;
  icon: string;
  summary: string;
  searchPlaceholder: string;
  defaultSortBy: string;
  filters: FilterDef[];
  columns: ColumnDef<T>[];
  detailFields: (row: T, helpers: RowHelpers) => DetailField[];
  draft: (currentUserId: string) => DraftOf<T>;
}

function ownerCell<T extends OwnedRecord>(row: T, helpers: RowHelpers) {
  return (
    <span className="owner-cell">
      <Badge tone="slate">{helpers.ownerName(row.ownerId)}</Badge>
      <small>{helpers.teamName(row.teamId)}</small>
    </span>
  );
}

function ownerExport<T extends OwnedRecord>(row: T, helpers: RowHelpers): string {
  return `${helpers.ownerName(row.ownerId)} - ${helpers.teamName(row.teamId)}`;
}

function customerCell(row: { customerId: string }, helpers: RowHelpers) {
  const visible = helpers.isCustomerVisible(row.customerId);
  return visible ? (
    helpers.customerName(row.customerId)
  ) : (
    <span className="text-muted">Ngoài phạm vi dữ liệu</span>
  );
}

function customerExport(row: { customerId: string }, helpers: RowHelpers): string {
  return helpers.isCustomerVisible(row.customerId) ? helpers.customerName(row.customerId) : 'Ngoài phạm vi';
}

const toneOf = (map: Record<string, BadgeTone>) => (value: string): BadgeTone => map[value] ?? 'slate';

const customerStatusTone = toneOf({ lead: 'amber', active: 'green', inactive: 'slate' });
const stageTone = toneOf({
  prospecting: 'slate',
  qualified: 'blue',
  proposal: 'amber',
  negotiation: 'violet',
  won: 'green',
  lost: 'red',
});
const activityStatusTone = toneOf({ todo: 'blue', done: 'green', overdue: 'red' });
const quoteStatusTone = toneOf({ draft: 'slate', sent: 'blue', accepted: 'green', rejected: 'red' });

export const customerConfig: EntityConfig<Customer> = {
  entity: 'customer',
  label: 'Khách hàng',
  route: '/customers',
  icon: 'KH',
  summary: 'Danh sách khách hàng được lọc theo phạm vi: của tôi / của nhóm tôi / tất cả.',
  searchPlaceholder: 'Tìm theo mã, tên khách, ngành, thành phố…',
  defaultSortBy: 'name',
  filters: [
    {
      key: 'status',
      label: 'Trạng thái',
      options: Object.entries(CUSTOMER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
  ],
  columns: [
    { key: 'code', header: 'Mã', exportValue: (row) => row.code },
    {
      key: 'name',
      header: 'Tên khách hàng',
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.name}</strong>
          <small>
            {row.industry} · {row.city}
          </small>
        </div>
      ),
      exportValue: (row) => `${row.name} (${row.industry}, ${row.city})`,
    },
    { key: 'phone', header: 'Điện thoại', exportValue: (row) => row.phone },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge tone={customerStatusTone(row.status)}>{CUSTOMER_STATUS_LABEL[row.status]}</Badge>
      ),
      exportValue: (row) => CUSTOMER_STATUS_LABEL[row.status],
    },
    { key: 'ownerId', header: 'Người sở hữu', render: ownerCell, exportValue: ownerExport },
    {
      key: 'updatedAt',
      header: 'Cập nhật',
      render: (row) => <span className="text-muted">{formatDateTime(row.updatedAt)}</span>,
      exportValue: (row) => formatDateTime(row.updatedAt),
    },
  ],
  detailFields: (row, helpers) => [
    { label: 'Mã khách hàng', value: row.code },
    { label: 'Tên khách hàng', value: row.name },
    { label: 'Ngành nghề', value: row.industry },
    { label: 'Thành phố', value: row.city },
    { label: 'Điện thoại', value: row.phone },
    { label: 'Email', value: row.email },
    { label: 'Trạng thái', value: CUSTOMER_STATUS_LABEL[row.status] },
    { label: 'Người sở hữu', value: `${helpers.ownerName(row.ownerId)} (${helpers.teamName(row.teamId)})` },
    { label: 'Ngày tạo', value: formatDate(row.createdAt) },
  ],
  draft: () => ({
    code: `KH-${Math.floor(Math.random() * 900 + 100)}`,
    name: 'Khách hàng mới',
    industry: 'Dịch vụ',
    city: 'Hà Nội',
    phone: '024 0000 0000',
    email: 'khachhangmoi@crm.vn',
    status: 'lead',
  }),
};

export const opportunityConfig: EntityConfig<Opportunity> = {
  entity: 'opportunity',
  label: 'Cơ hội',
  route: '/opportunities',
  icon: 'CO',
  summary: 'Cơ hội bán hàng, áp dụng cùng bộ quy tắc phạm vi với khách hàng.',
  searchPlaceholder: 'Tìm theo mã, tên cơ hội, giai đoạn…',
  defaultSortBy: 'closeDate',
  filters: [
    {
      key: 'stage',
      label: 'Giai đoạn',
      options: Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label })),
    },
  ],
  columns: [
    { key: 'code', header: 'Mã', exportValue: (row) => row.code },
    {
      key: 'title',
      header: 'Cơ hội',
      render: (row, helpers) => (
        <div className="cell-stack">
          <strong>{row.title}</strong>
          <small>{customerCell(row, helpers)}</small>
        </div>
      ),
      exportValue: (row) => row.title,
    },
    { key: 'customerId', header: 'Khách hàng', render: customerCell, exportValue: customerExport },
    {
      key: 'amount',
      header: 'Giá trị',
      align: 'right',
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
      exportValue: (row) => row.amount,
    },
    {
      key: 'stage',
      header: 'Giai đoạn',
      render: (row) => (
        <Badge tone={stageTone(row.stage)}>{STAGE_LABEL[row.stage]}</Badge>
      ),
      exportValue: (row) => STAGE_LABEL[row.stage],
    },
    { key: 'closeDate', header: 'Dự kiến chốt', exportValue: (row) => formatDate(row.closeDate) },
    { key: 'ownerId', header: 'Người sở hữu', render: ownerCell, exportValue: ownerExport },
  ],
  detailFields: (row, helpers) => [
    { label: 'Mã cơ hội', value: row.code },
    { label: 'Tên cơ hội', value: row.title },
    { label: 'Khách hàng', value: customerExport(row, helpers) },
    { label: 'Giá trị', value: formatCurrency(row.amount) },
    { label: 'Giai đoạn', value: STAGE_LABEL[row.stage] },
    { label: 'Ngày dự kiến chốt', value: formatDate(row.closeDate) },
    { label: 'Người sở hữu', value: helpers.ownerName(row.ownerId) },
    { label: 'Nhóm phụ trách', value: helpers.teamName(row.teamId) },
    { label: 'Ngày tạo', value: formatDate(row.createdAt) },
  ],
  draft: () => ({
    code: `CO-${Math.floor(Math.random() * 900 + 100)}`,
    title: 'Cơ hội mới',
    customerId: 'C1',
    amount: 50_000_000,
    stage: 'prospecting',
    closeDate: '2026-12-31',
  }),
};

export const activityConfig: EntityConfig<Activity> = {
  entity: 'activity',
  label: 'Hoạt động',
  route: '/activities',
  icon: 'HD',
  summary: 'Lịch gọi, họp, email và thăm khách - cùng phạm vi với các module khác.',
  searchPlaceholder: 'Tìm theo nội dung, loại hoạt động…',
  defaultSortBy: 'dueAt',
  filters: [
    {
      key: 'type',
      label: 'Loại',
      options: Object.entries(ACTIVITY_TYPE_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      options: Object.entries(ACTIVITY_STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
  ],
  columns: [
    {
      key: 'title',
      header: 'Hoạt động',
      render: (row, helpers) => (
        <div className="cell-stack">
          <strong>{row.title}</strong>
          <small>{customerCell(row, helpers)}</small>
        </div>
      ),
      exportValue: (row) => row.title,
    },
    {
      key: 'type',
      header: 'Loại',
      render: (row) => <Badge tone="blue">{ACTIVITY_TYPE_LABEL[row.type]}</Badge>,
      exportValue: (row) => ACTIVITY_TYPE_LABEL[row.type as ActivityType],
    },
    {
      key: 'dueAt',
      header: 'Hạn xử lý',
      render: (row) => <span>{formatDateTime(row.dueAt)}</span>,
      exportValue: (row) => formatDateTime(row.dueAt),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge tone={activityStatusTone(row.status)}>{ACTIVITY_STATUS_LABEL[row.status]}</Badge>
      ),
      exportValue: (row) => ACTIVITY_STATUS_LABEL[row.status],
    },
    { key: 'ownerId', header: 'Người sở hữu', render: ownerCell, exportValue: ownerExport },
  ],
  detailFields: (row, helpers) => [
    { label: 'Hoạt động', value: row.title },
    { label: 'Loại', value: ACTIVITY_TYPE_LABEL[row.type] },
    { label: 'Khách hàng', value: customerExport(row, helpers) },
    { label: 'Người thực hiện', value: helpers.ownerName(row.assigneeId) },
    { label: 'Hạn xử lý', value: formatDateTime(row.dueAt) },
    { label: 'Trạng thái', value: ACTIVITY_STATUS_LABEL[row.status] },
    { label: 'Người sở hữu bản ghi', value: helpers.ownerName(row.ownerId) },
    { label: 'Nhóm', value: helpers.teamName(row.teamId) },
  ],
  draft: (currentUserId) => ({
    title: 'Hoạt động mới',
    type: 'call',
    customerId: 'C1',
    assigneeId: currentUserId,
    dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    status: 'todo',
  }),
};

export const quoteConfig: EntityConfig<Quote> = {
  entity: 'quote',
  label: 'Báo giá',
  route: '/quotes',
  icon: 'BG',
  summary: 'Báo giá gửi khách hàng, chỉ hiển thị trong phạm vi được cấp.',
  searchPlaceholder: 'Tìm theo mã báo giá, trạng thái…',
  defaultSortBy: 'validUntil',
  filters: [
    {
      key: 'status',
      label: 'Trạng thái',
      options: Object.entries(QUOTE_STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
  ],
  columns: [
    { key: 'code', header: 'Mã báo giá', exportValue: (row) => row.code },
    { key: 'customerId', header: 'Khách hàng', render: customerCell, exportValue: customerExport },
    {
      key: 'amount',
      header: 'Giá trị',
      align: 'right',
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
      exportValue: (row) => row.amount,
    },
    {
      key: 'validUntil',
      header: 'Hiệu lực đến',
      exportValue: (row) => formatDate(row.validUntil),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => (
        <Badge tone={quoteStatusTone(row.status)}>{QUOTE_STATUS_LABEL[row.status]}</Badge>
      ),
      exportValue: (row) => QUOTE_STATUS_LABEL[row.status],
    },
    { key: 'ownerId', header: 'Người sở hữu', render: ownerCell, exportValue: ownerExport },
  ],
  detailFields: (row, helpers) => [
    { label: 'Mã báo giá', value: row.code },
    { label: 'Khách hàng', value: customerExport(row, helpers) },
    { label: 'Giá trị', value: formatCurrency(row.amount) },
    { label: 'Hiệu lực đến', value: formatDate(row.validUntil) },
    { label: 'Trạng thái', value: QUOTE_STATUS_LABEL[row.status] },
    { label: 'Người sở hữu', value: helpers.ownerName(row.ownerId) },
    { label: 'Nhóm', value: helpers.teamName(row.teamId) },
  ],
  draft: () => ({
    code: `BG-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    customerId: 'C1',
    opportunityId: 'O1',
    amount: 10_000_000,
    validUntil: '2026-12-31',
    status: 'draft',
  }),
};

export const ENTITY_CONFIGS = [
  customerConfig,
  opportunityConfig,
  activityConfig,
  quoteConfig,
] as const;

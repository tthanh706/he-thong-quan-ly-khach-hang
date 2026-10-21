export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type CareType = 'Bảo trì hệ thống định kỳ' | 'Thăm hỏi & Khảo sát hài lòng' | 'Gia hạn hợp đồng / dịch vụ';
export type CareStatus = 'PENDING' | 'DONE' | 'CANCELLED';

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  tax_code?: string;
  address?: string;
}

export interface SupportRequestItem {
  id: string;
  code: string;
  customer: string;
  customerId?: number;
  subject: string;
  description?: string;
  priority: SupportPriority;
  status: SupportStatus;
  assignee?: string;
  assigneeId?: number;
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  isOverdue?: boolean;
}

export interface PeriodicCareItem {
  id: string;
  customerName: string;
  customerId?: number;
  careType: CareType;
  scheduledDate: string;
  assignee?: string;
  assigneeId?: number;
  status: CareStatus;
  notes?: string;
  completedAt?: string;
  isOverdue?: boolean;
}

export interface ImportPreviewRow {
  key: string;
  row: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  tax_code?: string;
  address?: string;
  status: 'Hợp lệ' | 'Lỗi dữ liệu';
  errors: string[];
}

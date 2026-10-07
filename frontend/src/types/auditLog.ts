export interface AuditLogUser {
  id: number;
  name: string;
  email: string;
}

export interface AuditLog {
  id: number;
  user: AuditLogUser | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface AuditLogMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  meta: AuditLogMeta;
  message: string;
}

export interface AuditLogFilters {
  user_id?: number;
  entity_type?: string;
  from_date?: string;
  to_date?: string;
  per_page?: number;
}

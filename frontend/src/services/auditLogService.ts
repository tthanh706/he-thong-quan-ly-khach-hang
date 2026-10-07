import { apiRequest } from "../api/client";

import type { AuditLogFilters, AuditLogResponse } from "../types/auditLog";

export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogResponse> {
  const params = new URLSearchParams();

  if (filters.user_id) {
    params.set("user_id", String(filters.user_id));
  }

  if (filters.entity_type) {
    params.set("entity_type", filters.entity_type);
  }

  if (filters.from_date) {
    params.set("from_date", filters.from_date);
  }

  if (filters.to_date) {
    params.set("to_date", filters.to_date);
  }

  if (filters.per_page) {
    params.set("per_page", String(filters.per_page));
  }

  const query = params.toString();

  return apiRequest<AuditLogResponse>(
    `/v1/audit-logs${query ? `?${query}` : ""}`,
  );
}

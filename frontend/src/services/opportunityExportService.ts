import { apiRequest } from '../api/client';
import type {
  ApiResponse,
  OpportunityExportData,
  OpportunityFilterData,
  OpportunityFilters
} from '../types';

function buildQuery(filters: OpportunityFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.status) params.set('status', filters.status);
  if (filters.ownerUserId) {
    params.set('owner_user_id', String(filters.ownerUserId));
  }
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getOpportunities(
  filters: OpportunityFilters
): Promise<ApiResponse<OpportunityExportData>> {
  return apiRequest<ApiResponse<OpportunityExportData>>(
    `/v1/opportunity-export${buildQuery(filters)}`
  );
}

export function getOpportunityFilters(): Promise<
  ApiResponse<OpportunityFilterData>
> {
  return apiRequest<ApiResponse<OpportunityFilterData>>(
    '/v1/opportunity-export/filters'
  );
}

export async function exportOpportunities(
  filters: OpportunityFilters
): Promise<void> {
  const token = localStorage.getItem('session_token');

  const response = await fetch(
    `/api/v1/opportunity-export/export${buildQuery(filters)}`,
    {
      headers: {
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );

  if (!response.ok) {
    let message = 'Không thể xuất Excel.';

    try {
      const body = await response.json();
      message = body.message ?? message;
    } catch {
      // Giữ thông báo mặc định.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    filenameMatch?.[1] ?? 'danh-sach-co-hoi.xlsx';

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

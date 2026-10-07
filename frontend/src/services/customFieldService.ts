import {
  apiDownload,
  apiRequest,
} from "../api/client";

import type {
  CreateCustomFieldPayload,
  CustomFieldEntitiesResponse,
  CustomFieldListResponse,
  CustomFieldModule,
  CustomFieldValuesResponse,
} from "../types/customField";

export async function getCustomFields(
  module?: CustomFieldModule,
): Promise<CustomFieldListResponse> {
  const params = new URLSearchParams();

  params.set("per_page", "100");

  if (module) {
    params.set("module", module);
  }

  return apiRequest<CustomFieldListResponse>(
    `/v1/custom-fields?${params.toString()}`,
  );
}

export async function createCustomField(
  payload: CreateCustomFieldPayload,
): Promise<void> {
  await apiRequest("/v1/custom-fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomField(
  customFieldId: number,
): Promise<void> {
  await apiRequest(
    `/v1/custom-fields/${customFieldId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getCustomFieldValues(
  module: CustomFieldModule,
  entityId: number,
): Promise<CustomFieldValuesResponse> {
  return apiRequest<CustomFieldValuesResponse>(
    `/v1/custom-field-values/${module}/${entityId}`,
  );
}

export async function saveCustomFieldValues(
  module: CustomFieldModule,
  entityId: number,
  values: Record<string, string>,
): Promise<CustomFieldValuesResponse> {
  return apiRequest<CustomFieldValuesResponse>(
    `/v1/custom-field-values/${module}/${entityId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        values,
      }),
    },
  );
}

export async function filterCustomFieldEntities(
  module: CustomFieldModule,
  filters: Record<string, string>,
): Promise<CustomFieldEntitiesResponse> {
  const params = new URLSearchParams();

  params.set("per_page", "100");

  Object.entries(filters).forEach(
    ([fieldKey, value]) => {
      if (value.trim()) {
        params.set(
          `custom_fields[${fieldKey}]`,
          value,
        );
      }
    },
  );

  return apiRequest<CustomFieldEntitiesResponse>(
    `/v1/custom-field-entities/${module}?${params.toString()}`,
  );
}

export async function exportCustomFieldEntities(
  module: CustomFieldModule,
): Promise<void> {
  await apiDownload(
    `/v1/custom-field-exports/${module}`,
    `${module}-custom-fields.xlsx`,
  );
}
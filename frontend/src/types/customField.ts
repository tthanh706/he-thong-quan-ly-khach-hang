export type CustomFieldModule =
  | "customer"
  | "opportunity";

export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select";

export interface CustomFieldCreator {
  id: number;
  name: string;
  email: string;
}

export interface CustomField {
  id: number;
  module: CustomFieldModule;
  field_key: string;
  field_name: string;
  field_type: CustomFieldType;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  creator: CustomFieldCreator | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: number;
  field_key: string;
  field_name: string;
  field_type: CustomFieldType;
  options: string[];
  is_required: boolean;
  value: string | null;
}

export interface CustomFieldEntity {
  id: number;
  name: string;
  status: string | null;
  value: string | number | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  custom_fields: Record<string, string>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CustomFieldListResponse {
  success: boolean;
  data: CustomField[];
  meta: PaginationMeta;
  message: string;
}

export interface CustomFieldValuesResponse {
  success: boolean;
  data: CustomFieldValue[];
  message: string;
}

export interface CustomFieldEntitiesResponse {
  success: boolean;
  data: CustomFieldEntity[];
  meta: PaginationMeta;
  message: string;
}

export interface CreateCustomFieldPayload {
  module: CustomFieldModule;
  field_name: string;
  field_type: CustomFieldType;
  options?: string[];
  is_required: boolean;
}
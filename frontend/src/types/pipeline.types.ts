// ─── Pipeline Stage Conditions Types ────────────────────────────
// S5-04: Pipeline Stage Conditions - Frontend Type Definitions

export type ConditionType =
  | 'has_activity'
  | 'required_field'
  | 'min_value'
  | 'has_attachment'
  | 'has_contact'
  | 'custom';

export interface PipelineStage {
  id: number;
  pipeline_id: number;
  name: string;
  slug: string;
  position: number;
  description: string | null;
  is_active: boolean;
  conditions: StageCondition[];
  created_at: string;
  updated_at: string;
}

export interface StageCondition {
  id: number;
  pipeline_stage_id: number;
  condition_type: ConditionType;
  parameters: ConditionParameters;
  error_message: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ConditionParameters {
  activity_type?: string;
  min_count?: number;
  field_name?: string;
  min_value?: number;
  [key: string]: unknown;
}

export interface FailedCondition {
  condition_id: number;
  condition_type: ConditionType;
  error_message: string;
  parameters: ConditionParameters;
}

export interface PassedCondition {
  condition_id: number;
  condition_type: ConditionType;
}

export interface TransitionValidationResult {
  can_transition: boolean;
  failed_conditions: FailedCondition[];
  passed_conditions: PassedCondition[];
  user_can_override: boolean;
}

export interface TransitionPayload {
  target_stage_id: number;
  is_override?: boolean;
  override_reason?: string;
}

export interface TransitionResponse {
  message: string;
  data: {
    opportunity_id: number;
    new_stage: PipelineStage;
    overridden: boolean;
  };
}

export interface TransitionBlockedResponse {
  message: string;
  blocked: boolean;
  failed_conditions: FailedCondition[];
}

export interface CreateConditionPayload {
  pipeline_stage_id: number;
  condition_type: ConditionType;
  parameters: ConditionParameters;
  error_message: string;
  is_active?: boolean;
  priority?: number;
}

export interface StageConditionResponse {
  message: string;
  data: StageCondition;
}

export interface StagesListResponse {
  data: PipelineStage[];
}

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  has_activity: 'Yêu cầu hoạt động',
  required_field: 'Trường bắt buộc',
  min_value: 'Giá trị tối thiểu',
  has_attachment: 'Yêu cầu đính kèm',
  has_contact: 'Yêu cầu liên hệ',
  custom: 'Tùy chỉnh',
};

import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  CreateConditionPayload,
  StageConditionResponse,
  StagesListResponse,
  TransitionBlockedResponse,
  TransitionPayload,
  TransitionResponse,
  TransitionValidationResult,
} from '../types/pipeline.types';

const API_BASE = '/api';

/**
 * Pipeline Stage Conditions API Service
 */
export const pipelineApi = {
  /**
   * Get all stages of a pipeline with their transition conditions.
   */
  async getStagesWithConditions(pipelineId: number): Promise<StagesListResponse> {
    const response: AxiosResponse<StagesListResponse> = await axios.get(
      `${API_BASE}/pipelines/${pipelineId}/stages`
    );
    return response.data;
  },

  /**
   * Add a condition to a stage.
   */
  async createCondition(
    stageId: number,
    payload: CreateConditionPayload
  ): Promise<StageConditionResponse> {
    const response: AxiosResponse<StageConditionResponse> = await axios.post(
      `${API_BASE}/stages/${stageId}/conditions`,
      payload
    );
    return response.data;
  },

  /**
   * Update an existing condition.
   */
  async updateCondition(
    conditionId: number,
    payload: CreateConditionPayload
  ): Promise<StageConditionResponse> {
    const response: AxiosResponse<StageConditionResponse> = await axios.put(
      `${API_BASE}/conditions/${conditionId}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a condition.
   */
  async deleteCondition(conditionId: number): Promise<void> {
    await axios.delete(`${API_BASE}/conditions/${conditionId}`);
  },

  /**
   * Validate if an opportunity can transition to a target stage.
   */
  async validateTransition(
    opportunityId: number,
    targetStageId: number
  ): Promise<TransitionValidationResult> {
    const response: AxiosResponse<{ data: TransitionValidationResult }> = await axios.post(
      `${API_BASE}/opportunities/${opportunityId}/validate-transition`,
      { target_stage_id: targetStageId }
    );
    return response.data.data;
  },

  /**
   * Transition an opportunity to a new stage.
   * Returns TransitionResponse on success, throws TransitionBlockedResponse on 422.
   */
  async transitionStage(
    opportunityId: number,
    payload: TransitionPayload
  ): Promise<TransitionResponse> {
    try {
      const response: AxiosResponse<TransitionResponse> = await axios.post(
        `${API_BASE}/opportunities/${opportunityId}/transition`,
        payload
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<TransitionBlockedResponse>;
      if (axiosError.response?.status === 422 && axiosError.response?.data?.blocked) {
        throw axiosError.response.data;
      }
      throw error;
    }
  },
};

export default pipelineApi;

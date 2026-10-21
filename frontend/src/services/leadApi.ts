import axios, { AxiosResponse } from 'axios';
import type {
  CreateLeadPayload,
  CreateLeadResponse,
  DuplicateCheckResult,
  Lead,
  LeadListParams,
  LinkLeadResponse,
  LinkLeadToCustomerPayload,
  MergeLeadPayload,
  MergeLeadResponse,
  PaginatedResponse,
} from '../types/lead.types';

const API_BASE = '/api/leads';

/**
 * Lead Deduplication API Service
 *
 * Handles all API communication for lead management,
 * deduplication checking, merging, and customer linking.
 */
export const leadApi = {
  /**
   * Fetch paginated list of active leads.
   */
  async getLeads(params?: LeadListParams): Promise<PaginatedResponse<Lead>> {
    const response: AxiosResponse<PaginatedResponse<Lead>> = await axios.get(API_BASE, { params });
    return response.data;
  },

  /**
   * Get a single lead by ID with full details.
   */
  async getLead(id: number): Promise<Lead> {
    const response: AxiosResponse<{ data: Lead }> = await axios.get(`${API_BASE}/${id}`);
    return response.data.data;
  },

  /**
   * Create a new lead. Returns the lead + any duplicate warnings.
   */
  async createLead(payload: CreateLeadPayload): Promise<CreateLeadResponse> {
    const response: AxiosResponse<CreateLeadResponse> = await axios.post(API_BASE, payload);
    return response.data;
  },

  /**
   * Check for duplicates of a specific lead.
   */
  async checkDuplicates(leadId: number): Promise<DuplicateCheckResult> {
    const response: AxiosResponse<DuplicateCheckResult> = await axios.get(
      `${API_BASE}/${leadId}/check-duplicates`
    );
    return response.data;
  },

  /**
   * Merge two leads (secondary → primary).
   */
  async mergeLeads(payload: MergeLeadPayload): Promise<MergeLeadResponse> {
    const response: AxiosResponse<MergeLeadResponse> = await axios.post(`${API_BASE}/merge`, payload);
    return response.data;
  },

  /**
   * Link a lead to an existing customer record.
   */
  async linkLeadToCustomer(
    leadId: number,
    payload: LinkLeadToCustomerPayload
  ): Promise<LinkLeadResponse> {
    const response: AxiosResponse<LinkLeadResponse> = await axios.post(
      `${API_BASE}/${leadId}/link-customer`,
      payload
    );
    return response.data;
  },
};

export default leadApi;

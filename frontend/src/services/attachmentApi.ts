import axios, { AxiosResponse } from 'axios';
import type {
  AttachmentListResponse,
  DeleteAttachmentResponse,
  UploadAttachmentResponse,
} from '../types/attachment.types';

const API_BASE = '/api';

/**
 * Opportunity Attachments API Service
 *
 * Handles all API communication for file attachments
 * including upload, listing, download, and deletion.
 */
export const attachmentApi = {
  /**
   * Get all attachments for an opportunity.
   */
  async getAttachments(opportunityId: number): Promise<AttachmentListResponse> {
    const response: AxiosResponse<AttachmentListResponse> = await axios.get(
      `${API_BASE}/opportunities/${opportunityId}/attachments`
    );
    return response.data;
  },

  /**
   * Upload multiple files to an opportunity.
   * Uses FormData for multipart upload with progress tracking.
   */
  async uploadFiles(
    opportunityId: number,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<UploadAttachmentResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    const response: AxiosResponse<UploadAttachmentResponse> = await axios.post(
      `${API_BASE}/opportunities/${opportunityId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return response.data;
  },

  /**
   * Download an attachment by opening its download URL.
   */
  downloadAttachment(downloadUrl: string): void {
    window.open(downloadUrl, '_blank');
  },

  /**
   * Download an attachment as a blob (for programmatic use).
   */
  async downloadAttachmentBlob(attachmentId: number): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    );
    return response.data as Blob;
  },

  /**
   * Delete a specific attachment.
   */
  async deleteAttachment(attachmentId: number): Promise<DeleteAttachmentResponse> {
    const response: AxiosResponse<DeleteAttachmentResponse> = await axios.delete(
      `${API_BASE}/attachments/${attachmentId}`
    );
    return response.data;
  },
};

export default attachmentApi;

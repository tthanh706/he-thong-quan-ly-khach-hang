// ─── Opportunity Attachment Types ────────────────────────────────
// S6-04: Opportunity Attachments - Frontend Type Definitions

export interface OpportunityAttachment {
  id: number;
  opportunity_id: number;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  formatted_size: string;
  uploaded_by: number;
  uploader: AttachmentUploader | null;
  download_url: string;
  created_at: string;
  updated_at: string;
}

export interface AttachmentUploader {
  id: number;
  name: string;
}

export interface AttachmentListResponse {
  data: OpportunityAttachment[];
  meta: AttachmentListMeta;
}

export interface AttachmentListMeta {
  total_files: number;
  total_size: number;
  total_size_formatted: string;
}

export interface UploadAttachmentResponse {
  message: string;
  data: OpportunityAttachment[];
}

export interface DeleteAttachmentResponse {
  message: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export type SortField = 'original_name' | 'file_size' | 'created_at';
export type SortDirection = 'asc' | 'desc';

export interface AttachmentSortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Maximum file size in bytes (20MB).
 */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * Allowed MIME types for upload.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
] as const;

/**
 * Get icon for file type.
 */
export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📽️',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
  'text/plain': '📃',
  'text/csv': '📊',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/zip': '🗜️',
  'application/x-rar-compressed': '🗜️',
  'application/x-7z-compressed': '🗜️',
};

import React, { useCallback, useEffect, useState } from 'react';
import attachmentApi from '../services/attachmentApi';
import type {
  AttachmentListMeta,
  OpportunityAttachment,
} from '../types/attachment.types';
import FileUploadZone from './FileUploadZone';
import AttachmentTable from './AttachmentTable';

interface OpportunityAttachmentPanelProps {
  opportunityId: number;
  canUpload: boolean;
  canDelete: boolean;
}

/**
 * OpportunityAttachmentPanel
 *
 * Main component for managing opportunity attachments.
 * Displays file list with metadata, upload zone, and delete actions.
 */
const OpportunityAttachmentPanel: React.FC<OpportunityAttachmentPanelProps> = ({
  opportunityId,
  canUpload,
  canDelete,
}) => {
  const [attachments, setAttachments] = useState<OpportunityAttachment[]>([]);
  const [meta, setMeta] = useState<AttachmentListMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await attachmentApi.getAttachments(opportunityId);
      setAttachments(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError('Không thể tải danh sách tệp đính kèm.');
      console.error('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUploadSuccess = (message: string) => {
    setSuccessMessage(message);
    fetchAttachments();
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleDelete = async (attachmentId: number, fileName: string) => {
    if (!window.confirm(`Bạn chắc chắn muốn xoá tệp "${fileName}"?`)) return;

    try {
      const result = await attachmentApi.deleteAttachment(attachmentId);
      setSuccessMessage(result.message);
      fetchAttachments();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError('Xoá tệp thất bại.');
      console.error('Delete failed:', err);
    }
  };

  const handleDownload = (downloadUrl: string) => {
    attachmentApi.downloadAttachment(downloadUrl);
  };

  return (
    <div className="attachment-panel">
      <header className="attachment-panel__header">
        <h2>Tệp đính kèm</h2>
        {meta && (
          <div className="attachment-panel__summary">
            <span>{meta.total_files} tệp</span>
            <span className="attachment-panel__separator">•</span>
            <span>Tổng: {meta.total_size_formatted}</span>
          </div>
        )}
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert--success" role="status">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="alert__close">×</button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
          <button onClick={() => setError(null)} className="alert__close">×</button>
        </div>
      )}

      {/* Upload Zone */}
      {canUpload && (
        <FileUploadZone
          opportunityId={opportunityId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      )}

      {/* Attachments Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Đang tải...</span>
        </div>
      ) : (
        <AttachmentTable
          attachments={attachments}
          canDelete={canDelete}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default OpportunityAttachmentPanel;

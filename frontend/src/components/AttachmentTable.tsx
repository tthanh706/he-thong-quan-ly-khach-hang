import React, { useMemo, useState } from 'react';
import type {
  AttachmentSortConfig,
  OpportunityAttachment,
  SortField,
} from '../types/attachment.types';
import { FILE_TYPE_ICONS } from '../types/attachment.types';

interface AttachmentTableProps {
  attachments: OpportunityAttachment[];
  canDelete: boolean;
  onDownload: (downloadUrl: string) => void;
  onDelete: (attachmentId: number, fileName: string) => void;
}

/**
 * AttachmentTable
 *
 * Displays a sortable table of attachments with metadata:
 * file name, size, uploader, timestamp, and action buttons.
 */
const AttachmentTable: React.FC<AttachmentTableProps> = ({
  attachments,
  canDelete,
  onDownload,
  onDelete,
}) => {
  const [sortConfig, setSortConfig] = useState<AttachmentSortConfig>({
    field: 'created_at',
    direction: 'desc',
  });

  const sortedAttachments = useMemo(() => {
    const sorted = [...attachments].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'original_name':
          comparison = a.original_name.localeCompare(b.original_name);
          break;
        case 'file_size':
          comparison = a.file_size - b.file_size;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [attachments, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIndicator = (field: SortField): string => {
    if (sortConfig.field !== field) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getFileIcon = (mimeType: string): string => {
    return FILE_TYPE_ICONS[mimeType] ?? '📎';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (attachments.length === 0) {
    return (
      <div className="attachment-table__empty">
        <div className="attachment-table__empty-icon">📂</div>
        <p>Chưa có tệp đính kèm nào.</p>
        <p className="attachment-table__empty-hint">Kéo thả tệp hoặc nhấn nút tải lên bên trên.</p>
      </div>
    );
  }

  return (
    <div className="attachment-table-wrapper">
      <table className="attachment-table">
        <thead>
          <tr>
            <th className="attachment-table__th--icon" />
            <th
              className="attachment-table__th--sortable"
              onClick={() => handleSort('original_name')}
            >
              Tên tệp {getSortIndicator('original_name')}
            </th>
            <th
              className="attachment-table__th--sortable"
              onClick={() => handleSort('file_size')}
            >
              Kích thước {getSortIndicator('file_size')}
            </th>
            <th>Người tải lên</th>
            <th
              className="attachment-table__th--sortable"
              onClick={() => handleSort('created_at')}
            >
              Thời điểm {getSortIndicator('created_at')}
            </th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sortedAttachments.map((attachment) => (
            <tr key={attachment.id} className="attachment-table__row">
              <td className="attachment-table__icon">
                {getFileIcon(attachment.mime_type)}
              </td>
              <td className="attachment-table__name" title={attachment.original_name}>
                {attachment.original_name}
              </td>
              <td className="attachment-table__size">
                {attachment.formatted_size}
              </td>
              <td className="attachment-table__uploader">
                {attachment.uploader?.name ?? '—'}
              </td>
              <td className="attachment-table__date">
                {formatDate(attachment.created_at)}
              </td>
              <td className="attachment-table__actions">
                <button
                  className="btn btn--sm btn--outline"
                  onClick={() => onDownload(attachment.download_url)}
                  title="Tải xuống"
                >
                  ⬇ Tải
                </button>
                {canDelete && (
                  <button
                    className="btn btn--sm btn--danger-outline"
                    onClick={() => onDelete(attachment.id, attachment.original_name)}
                    title="Xoá tệp"
                  >
                    🗑 Xoá
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttachmentTable;

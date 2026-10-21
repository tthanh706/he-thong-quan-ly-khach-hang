import React, { useCallback, useRef, useState } from 'react';
import attachmentApi from '../services/attachmentApi';
import { MAX_FILE_SIZE_BYTES } from '../types/attachment.types';

interface FileUploadZoneProps {
  opportunityId: number;
  onUploadSuccess: (message: string) => void;
  onUploadError: (error: string) => void;
}

/**
 * FileUploadZone
 *
 * Drag-and-drop + click-to-select multi-file upload zone.
 * Validates file size (max 20MB per file) before uploading.
 * Shows upload progress.
 */
const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  opportunityId,
  onUploadSuccess,
  onUploadError,
}) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" vượt quá giới hạn 20MB (${formatSize(file.size)}).`);
      } else {
        valid.push(file);
      }
    }

    if (files.length > 10) {
      errors.push('Tối đa 10 tệp mỗi lần tải.');
    }

    return { valid: valid.slice(0, 10), errors };
  };

  const formatSize = (bytes: number): string => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      onUploadError(errors.join(' '));
    }

    setSelectedFiles(valid);
  }, [onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await attachmentApi.uploadFiles(
        opportunityId,
        selectedFiles,
        (percent) => setUploadProgress(percent)
      );
      onUploadSuccess(result.message);
      setSelectedFiles([]);
      setUploadProgress(0);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Tải tệp thất bại.';
      onUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-zone-wrapper">
      {/* Drop Zone */}
      <div
        className={`upload-zone ${isDragOver ? 'upload-zone--drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        aria-label="Kéo thả tệp hoặc nhấp để chọn"
      >
        <div className="upload-zone__icon">📎</div>
        <p className="upload-zone__text">
          Kéo thả tệp vào đây hoặc <span className="upload-zone__browse">nhấp để chọn</span>
        </p>
        <p className="upload-zone__hint">
          Tối đa 20MB / tệp • Tối đa 10 tệp / lần
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="upload-zone__input"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"
      />

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="upload-zone__selected">
          <h4>Tệp đã chọn ({selectedFiles.length})</h4>
          <ul className="selected-files-list">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`} className="selected-file">
                <span className="selected-file__name">{file.name}</span>
                <span className="selected-file__size">{formatSize(file.size)}</span>
                <button
                  className="selected-file__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  title="Xoá khỏi danh sách"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="upload-progress__bar">
                <div
                  className="upload-progress__fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="upload-progress__text">{uploadProgress}%</span>
            </div>
          )}

          {/* Upload Button */}
          <button
            className="btn btn--primary"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? `Đang tải lên... ${uploadProgress}%` : `Tải lên ${selectedFiles.length} tệp`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;

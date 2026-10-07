import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { userImportService, ImportPreviewResponse, ImportSubmitResponse } from '../services/userImportService';
import './UserImportPage.css';

export default function UserImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      await userImportService.downloadTemplate();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải file mẫu');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|csv)$/)) {
      toast.error('Vui lòng chọn file .xlsx hoặc .csv');
      return;
    }
    setFile(selectedFile);
    setIsLoading(true);
    setPreviewData(null);
    try {
      const response = await userImportService.importFile(selectedFile, true);
      if ('preview_data' in response.data) {
        setPreviewData(response.data as ImportPreviewResponse['data']);
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi đọc file. Vui lòng kiểm tra lại định dạng.');
      setFile(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const response = await userImportService.importFile(file, false) as ImportSubmitResponse;
      toast.success(response.message || `Đã nhập thành công ${response.data?.total_imported} người dùng.`);
      setFile(null);
      setPreviewData(null);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi nhập dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-import-page">
      <div className="import-header">
        <h1>Nhập danh sách người dùng</h1>
        <button className="template-btn" onClick={handleDownloadTemplate}>
          <Download size={18} />
          Tải file mẫu
        </button>
      </div>

      <div className="import-card">
        {!previewData && (
          <div
            className={`upload-section ${isDragging ? 'drag-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud size={48} className="upload-icon" />
            <p className="upload-text">Kéo thả file .xlsx hoặc .csv vào đây</p>
            <p className="upload-subtext">hoặc click để chọn file từ máy tính</p>
            
            <input
              type="file"
              accept=".xlsx,.csv"
              className="file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <button 
              className="upload-btn" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đọc file...' : 'Chọn file'}
            </button>
          </div>
        )}

        {previewData && (
          <div className="preview-section">
            <h2>Kết quả kiểm tra dữ liệu</h2>
            <div className="preview-stats">
              <div className="stat-box success">
                <span>Số dòng hợp lệ</span>
                <span className="stat-value">{previewData.total_valid}</span>
              </div>
              <div className="stat-box error">
                <span>Số dòng lỗi</span>
                <span className="stat-value">{previewData.total_invalid}</span>
              </div>
            </div>

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Trạng thái</th>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Nhóm kinh doanh</th>
                    <th>Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview_data.map((row, idx) => (
                    <tr key={idx} className={!row.is_valid ? 'row-error' : ''}>
                      <td>{row.row_index}</td>
                      <td>
                        {row.is_valid ? (
                          <CheckCircle size={18} color="#059669" />
                        ) : (
                          <AlertCircle size={18} color="#dc2626" />
                        )}
                      </td>
                      <td>{row.data?.name || ''}</td>
                      <td>{row.data?.email || ''}</td>
                      <td>{row.data?.role || ''}</td>
                      <td>{row.data?.team_id || ''}</td>
                      <td>
                        {!row.is_valid && row.errors && (
                          <ul className="error-list">
                            {Object.values(row.errors).flat().map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="action-footer">
              <button 
                className="template-btn" 
                onClick={() => { setPreviewData(null); setFile(null); }}
                disabled={isLoading}
              >
                Hủy bỏ
              </button>
              <button 
                className="upload-btn" 
                onClick={handleSubmit}
                disabled={isLoading || previewData.total_valid === 0}
              >
                {isLoading ? 'Đang xử lý...' : `Nhập ${previewData.total_valid} người dùng`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

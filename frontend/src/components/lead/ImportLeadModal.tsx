import React, { useState } from 'react';
import { leadService } from '../../services/leadService';
import { Download, Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportLeadModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    rows: Array<{
      row_number: number;
      is_valid: boolean;
      errors: string[];
      data: Record<string, any>;
    }>;
  } | null>(null);

  if (!open) return null;

  const handleDownloadTemplate = () => {
    // Tải template CSV/Excel trực tiếp
    const csvContent = "\uFEFF" + "Họ tên,Email,Số điện thoại,Công ty,Nguồn,Ngành nghề,Quy mô,Nhu cầu\n" +
      "Nguyễn Văn A,vana@congty.com,0912345678,Công ty CP ABC,Sự kiện Diễn đàn Số,Công nghệ thông tin,Vừa (50 - 200 người),Triển khai ERP\n" +
      "Trần Thị B,thib@doanhnghiep.vn,0987654321,Tập đoàn XYZ,Hội thảo Q4,Bán lẻ & Thương mại,Doanh nghiệp lớn (200+ người),CRM Bán hàng\n" +
      "Lê Văn C,,12345,,Khác,,,Thiếu email và SĐT sai (Ví dụ lỗi)";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mau_nhap_lead_hang_loat.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setLoading(true);

    try {
      const res = await leadService.previewImport(selectedFile);
      setPreviewData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Không thể đọc tệp dữ liệu.');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData || previewData.rows.length === 0) return;

    setLoading(true);
    setError('');
    try {
      await leadService.confirmImport(previewData.rows);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi nhập dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Nhập Lead từ Excel / CSV</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0' }}>Nhập Lead hàng loạt có Xem trước & Báo lỗi từng dòng</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1e293b', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
          >
            <Download size={16} /> Tải tệp mẫu (CSV / Excel)
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '6px', background: '#2563eb', color: '#fff', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
            <Upload size={16} /> {file ? file.name : 'Chọn tệp tải lên...'}
            <input type="file" accept=".csv,.xlsx,.xls,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Đang xử lý và kiểm tra dữ liệu theo từng dòng...</div>}

        {previewData && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ padding: '6px 12px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontWeight: 600 }}>
                Tổng: {previewData.total_rows} dòng
              </span>
              <span style={{ padding: '6px 12px', borderRadius: '6px', background: '#dcfce7', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Hợp lệ: {previewData.valid_rows} dòng
              </span>
              <span style={{ padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> Có lỗi: {previewData.invalid_rows} dòng
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: '50px' }}>STT</th>
                    <th style={{ padding: '8px 12px' }}>Họ tên</th>
                    <th style={{ padding: '8px 12px' }}>SĐT / Email</th>
                    <th style={{ padding: '8px 12px' }}>Công ty</th>
                    <th style={{ padding: '8px 12px' }}>Nguồn</th>
                    <th style={{ padding: '8px 12px' }}>Trạng thái / Báo lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row) => (
                    <tr
                      key={row.row_number}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: row.is_valid ? '#ffffff' : '#fef2f2',
                      }}
                    >
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>#{row.row_number}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.data.name || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <div>{row.data.phone || '—'}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{row.data.email || '—'}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>{row.data.company || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {row.data.source || 'Chưa có'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.is_valid ? (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Hợp lệ</span>
                        ) : (
                          <div style={{ color: '#dc2626' }}>
                            {row.errors.map((err, i) => (
                              <div key={i}>• {err}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer' }}
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={loading || !previewData || previewData.valid_rows === 0}
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#16a34a',
              color: '#fff',
              fontWeight: 600,
              cursor: loading || !previewData || previewData.valid_rows === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang nhập...' : `Xác nhận nhập ${previewData ? previewData.valid_rows : 0} Lead hợp lệ`}
          </button>
        </div>
      </div>
    </div>
  );
};

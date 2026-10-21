import React, { useEffect, useState } from 'react';
import { salesOpportunityService } from '../../services/salesOpportunityService';
import type { ForecastData } from '../../types/salesOpportunity';
import { TrendingUp, DollarSign, Target, Calendar, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ForecastModal: React.FC<Props> = ({ open, onClose }) => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<string>('this_month');

  useEffect(() => {
    if (open) {
      void loadForecast();
    }
  }, [open, period]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await salesOpportunityService.getForecast({ period });
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải dự báo doanh số');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>Báo cáo & Dự Báo Doanh Số Bán Hàng</span>
            <h2 style={{ fontSize: '19px', fontWeight: 700, margin: '2px 0 0 0' }}>Dự Báo Doanh Số Theo Trọng Số Xác Suất (Weighted Forecast)</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tính toán dự báo doanh số...</div>
        ) : (
          data && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 3 THẺ KỲ DỰ BÁO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {/* Tháng này */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ color: '#1e40af', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>📅 Dự báo Tháng Này</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8' }}>
                    {Number(data.this_month?.weighted_forecast || 0).toLocaleString('vi')} đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Pipeline: {Number(data.this_month?.pipeline || 0).toLocaleString('vi')} đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    Đã chốt thắng: {Number(data.this_month?.won || 0).toLocaleString('vi')} đ
                  </div>
                </div>

                {/* Tháng sau */}
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ color: '#5b21b6', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>📅 Dự báo Tháng Sau</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#6d28d9' }}>
                    {Number(data.next_month?.weighted_forecast || 0).toLocaleString('vi')} đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Pipeline: {Number(data.next_month?.pipeline || 0).toLocaleString('vi')} đ
                  </div>
                </div>

                {/* Quý này */}
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ color: '#065f46', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>📊 Dự báo Quý Này</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#047857' }}>
                    {Number(data.this_quarter?.weighted_forecast || 0).toLocaleString('vi')} đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Pipeline: {Number(data.this_quarter?.pipeline || 0).toLocaleString('vi')} đ
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    Đã chốt thắng: {Number(data.this_quarter?.won || 0).toLocaleString('vi')} đ
                  </div>
                </div>
              </div>

              {/* BẢNG CHI TIẾT THEO TỪNG NHÂN VIÊN & NHÓM */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  Chi tiết dự báo theo từng nhân viên kinh doanh
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nhân viên</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Số cơ hội</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tổng Pipeline</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Dự báo theo xác suất</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Đã chốt thực tế</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_rep?.map((rep) => (
                        <tr key={rep.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                            {rep.user_name}
                            <div style={{ color: '#64748b', fontSize: '11px' }}>{rep.email}</div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{rep.deal_count}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number(rep.pipeline_value).toLocaleString('vi')} đ</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                            {Number(rep.weighted_forecast).toLocaleString('vi')} đ
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {Number(rep.actual_won).toLocaleString('vi')} đ
                          </td>
                        </tr>
                      ))}
                      {(!data.by_rep || data.by_rep.length === 0) && (
                        <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có số liệu nhân viên.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

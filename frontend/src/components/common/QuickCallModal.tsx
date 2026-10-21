import React, { useEffect, useState } from 'react';
import { Phone, PhoneCall, CheckCircle, Clock, Calendar, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityTimelineService } from '../../services/activityTimelineService';
import { api } from '../../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCustomerId?: number | string;
  onSuccess?: () => void;
}

export const QuickCallModal: React.FC<Props> = ({ open, onClose, defaultCustomerId, onSuccess }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | string>(defaultCustomerId || '');
  const [callResult, setCallResult] = useState<'connected' | 'busy' | 'no_answer' | 'wrong_number'>('connected');
  const [note, setNote] = useState<string>('');
  const [callbackAt, setCallbackAt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (defaultCustomerId) {
        setCustomerId(defaultCustomerId);
      }
      void loadCustomers();
    }
  }, [open, defaultCustomerId]);

  const loadCustomers = async () => {
    try {
      const res = await api<{ success: boolean; data: any[] }>('/v1/customers');
      if (res && res.data && Array.isArray(res.data)) {
        setCustomers(res.data);
        if (!customerId && res.data.length > 0) {
          setCustomerId(res.data[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  const handleSetQuickCallback = (hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const pad = (n: number) => String(n).padStart(2, '0');
    const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setCallbackAt(str);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng (Chạm 1)');
      return;
    }

    setLoading(true);
    try {
      const res = await activityTimelineService.quickCallLog({
        customer_id: Number(customerId),
        call_result: callResult,
        note: note.trim() || undefined,
        callback_at: callbackAt || undefined,
      });

      if (res.success) {
        toast.success(res.message || 'Đã ghi nhận cuộc gọi và liên kết cơ hội thành công!');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      toast.error(err.message || 'Không thể ghi nhận cuộc gọi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            padding: '18px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneCall size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Ghi nhanh cuộc gọi</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>
                Tối ưu 3 thao tác chạm trên điện thoại di động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 0,
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Step 1: Chọn Khách hàng */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              1. Khách hàng nhận cuộc gọi *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                background: '#fff',
                outline: 'none',
              }}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code || `KH${c.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Kết quả cuộc gọi (4 Big Buttons) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              2. Kết quả cuộc gọi (Chạm chọn) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCallResult('connected')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: callResult === 'connected' ? '2px solid #059669' : '1.5px solid #e2e8f0',
                  background: callResult === 'connected' ? '#ecfdf5' : '#f8fafc',
                  color: callResult === 'connected' ? '#047857' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🟢</span> Kết nối thành công
              </button>

              <button
                type="button"
                onClick={() => setCallResult('busy')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: callResult === 'busy' ? '2px solid #d97706' : '1.5px solid #e2e8f0',
                  background: callResult === 'busy' ? '#fffbeb' : '#f8fafc',
                  color: callResult === 'busy' ? '#b45309' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🟡</span> Khách bận máy
              </button>

              <button
                type="button"
                onClick={() => setCallResult('no_answer')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: callResult === 'no_answer' ? '2px solid #dc2626' : '1.5px solid #e2e8f0',
                  background: callResult === 'no_answer' ? '#fef2f2' : '#f8fafc',
                  color: callResult === 'no_answer' ? '#b91c1c' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🟠</span> Không nghe máy
              </button>

              <button
                type="button"
                onClick={() => setCallResult('wrong_number')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: callResult === 'wrong_number' ? '2px solid #64748b' : '1.5px solid #e2e8f0',
                  background: callResult === 'wrong_number' ? '#f1f5f9' : '#f8fafc',
                  color: callResult === 'wrong_number' ? '#334155' : '#475569',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🔴</span> Sai số điện thoại
              </button>
            </div>
          </div>

          {/* Step 3: Ghi chú ngắn & Gọi lại */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                3. Ghi chú & Đặt hẹn gọi lại
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleSetQuickCallback(2)}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: '#334155' }}
                >
                  +2h
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickCallback(24)}
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', color: '#334155' }}
                >
                  Ngày mai
                </button>
              </div>
            </div>

            <textarea
              placeholder="Ghi chú ngắn kết quả trao đổi (Ví dụ: Khách đồng ý xem demo thứ 5 tới...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13.5px',
                resize: 'none',
                outline: 'none',
                marginBottom: '8px',
              }}
            />

            {callbackAt && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#1d4ed8' }}>
                <span>⏰ Lịch gọi lại: <strong>{new Date(callbackAt).toLocaleString('vi-VN')}</strong></span>
                <button
                  type="button"
                  onClick={() => setCallbackAt('')}
                  style={{ background: 'none', border: 0, color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                >
                  Xóa
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: '11.5px', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
            ℹ️ Hệ thống sẽ tự động gán cuộc gọi này vào cơ hội bán hàng đang mở gần nhất của khách hàng.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '10px',
                border: 0,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
              }}
            >
              <PhoneCall size={17} />
              {loading ? 'Đang lưu...' : 'Lưu cuộc gọi (Chạm 3)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default QuickCallModal;

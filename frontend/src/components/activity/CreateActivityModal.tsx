import React, { useState } from 'react';
import { ActivityType, CreateActivityPayload } from '../../types/activity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateActivityPayload) => void;
}

// Data Mẫu Khách hàng, Liên hệ, Cơ hội
const mockCustomers = [
  { id: 1, name: 'Tập đoàn Công nghệ A' },
  { id: 2, name: 'Công ty Cổ phần B' },
  { id: 3, name: 'Ngân hàng Thương mại D' },
];

const mockContacts = [
  { id: 101, customer_id: 1, name: 'Anh Minh (Trưởng phòng IT)' },
  { id: 102, customer_id: 1, name: 'Chị Hoa (Kế toán trưởng)' },
  { id: 103, customer_id: 2, name: 'Anh Tuấn (Giám đốc Dự án)' },
];

const mockOpportunities = [
  { id: 201, customer_id: 1, title: 'Hợp đồng ERP 300Tr' },
  { id: 202, customer_id: 2, title: 'Tư vấn phần mềm CRM' },
];

export const CreateActivityModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<ActivityType>('call');
  const [customerId, setCustomerId] = useState<number>(1);
  const [contactId, setContactId] = useState<string>('');
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [performedAt, setPerformedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState<number>(15);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');

  if (!isOpen) return null;

  // Lọc liên hệ & cơ hội theo khách hàng đang chọn
  const filteredContacts = mockContacts.filter((c) => c.customer_id === Number(customerId));
  const filteredOpps = mockOpportunities.filter((o) => o.customer_id === Number(customerId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Vui lòng nhập Tóm tắt tiêu đề và Nội dung chi tiết trao đổi!');
      return;
    }

    onSubmit({
      customer_id: Number(customerId),
      contact_id: contactId ? Number(contactId) : null,
      opportunity_id: opportunityId ? Number(opportunityId) : null,
      type,
      title,
      performed_at: performedAt.replace('T', ' '),
      duration_minutes: Number(duration) || 0,
      description,
      result,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h3 className="font-bold text-base">Ghi nhận Hoạt động Khách hàng</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Loại hoạt động - Chọn nhanh dạng Tab Icons */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Loại hoạt động <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'call', label: 'Cuộc gọi', icon: '📞' },
                { key: 'meeting', label: 'Cuộc gặp', icon: '🤝' },
                { key: 'email', label: 'Email', icon: '✉️' },
                { key: 'note', label: 'Ghi chú', icon: '📌' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setType(item.key as ActivityType)}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                    type === item.key
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Khách hàng */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Khách hàng <span className="text-rose-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(Number(e.target.value));
                setContactId('');
                setOpportunityId('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
            >
              {mockCustomers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>

          {/* Liên kết Người liên hệ & Cơ hội */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Người liên hệ liên quan</label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Không chọn --</option>
                {filteredContacts.map((cnt) => (
                  <option key={cnt.id} value={cnt.id}>
                    {cnt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cơ hội bán hàng liên quan</label>
              <select
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Không chọn --</option>
                {filteredOpps.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tiêu đề ngắn */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tóm tắt tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Gọi điện chốt hợp đồng tư vấn ERP"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Thời điểm diễn ra & Thời lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Thời điểm thực hiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời lượng (phút)</label>
              <input
                type="number"
                min={0}
                placeholder="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nội dung trao đổi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ghi nhận chi tiết nội dung cuộc gọi/cuộc gặp/email..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Kết quả */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kết quả / Bước tiếp theo</label>
            <input
              type="text"
              placeholder="VD: Khách hàng đồng ý nhận báo giá qua Email vào chiều nay"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Lưu Hoạt Động</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
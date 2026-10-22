import React, { useState } from 'react';
import { CloseWonPayload } from '../../types/opportunity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CloseWonPayload) => void;
  defaultRevenue?: number;
}

export const CloseWonModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, defaultRevenue = 0 }) => {
  const [revenue, setRevenue] = useState<number>(defaultRevenue);
  const [closeDate, setCloseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ actual_revenue: revenue, actual_close_date: closeDate });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-emerald-600 mb-4">🏆 Đóng Thắng Thương Vụ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị chốt thực tế (VNĐ) *</label>
            <input
              type="number"
              required
              min="0"
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500"
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày ký hợp đồng *</label>
            <input
              type="date"
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-emerald-500"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Xác nhận Thắng</button>
          </div>
        </form>
      </div>
    </div>
  );
};
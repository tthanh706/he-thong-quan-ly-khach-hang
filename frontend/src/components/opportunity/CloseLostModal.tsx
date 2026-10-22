import React, { useState } from 'react';
import { CloseLostPayload } from '../../types/opportunity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CloseLostPayload) => void;
  lossReasons: { id: number; name: string }[];
  competitors: { id: number; name: string }[];
}

export const CloseLostModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, lossReasons, competitors }) => {
  const [lossReasonId, setLossReasonId] = useState<number>(lossReasons[0]?.id || 0);
  const [lossNote, setLossNote] = useState<string>('');
  const [competitorId, setCompetitorId] = useState<string>('');
  const [competitorCustom, setCompetitorCustom] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      loss_reason_id: lossReasonId,
      loss_reason_note: lossNote,
      competitor_id: competitorId ? Number(competitorId) : undefined,
      competitor_name_custom: competitorCustom || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-4">❌ Đóng Thua Thương Vụ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lý do thua *</label>
            <select
              required
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-rose-500"
              value={lossReasonId}
              onChange={(e) => setLossReasonId(Number(e.target.value))}
            >
              {lossReasons.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đối thủ thắng thầu (Nếu có)</label>
            <select
              className="w-full border rounded-md p-2 mb-2 focus:ring-2 focus:ring-rose-500"
              value={competitorId}
              onChange={(e) => setCompetitorId(e.target.value)}
            >
              <option value="">-- Chọn đối thủ trong danh mục --</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Hoặc nhập tên đối thủ khác..."
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-rose-500"
              value={competitorCustom}
              onChange={(e) => setCompetitorCustom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú chi tiết</label>
            <textarea
              className="w-full border rounded-md p-2 focus:ring-2 focus:ring-rose-500"
              rows={3}
              value={lossNote}
              onChange={(e) => setLossNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700">Xác nhận Thua</button>
          </div>
        </form>
      </div>
    </div>
  );
};
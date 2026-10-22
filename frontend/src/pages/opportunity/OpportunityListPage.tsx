import React, { useState } from 'react';
import { opportunityService } from '../../services/opportunityService';
import { Opportunity } from '../../types/opportunity';

interface OpportunityItem extends Opportunity {
  loss_reason_text?: string;
}

const initialOpportunities: OpportunityItem[] = [
  {
    id: 1,
    title: 'Hợp đồng tư vấn phần mềm CRM',
    customer_name: 'Tập đoàn A',
    amount: 150000000,
    status: 'in_progress',
    created_at: '2026-10-15',
  },
  {
    id: 2,
    title: 'Triển khai hệ thống ERP',
    customer_name: 'Công ty B',
    amount: 300000000,
    status: 'won',
    actual_revenue: 300000000,
    actual_close_date: '2026-10-18',
    created_at: '2026-10-10',
  },
  {
    id: 3,
    title: 'Cung cấp hạ tầng Server Cloud',
    customer_name: 'Đối tác C',
    amount: 80000000,
    status: 'lost',
    loss_reason_text: 'Giá cao hơn ngân sách của khách hàng 20%',
    created_at: '2026-10-05',
  },
  {
    id: 4,
    title: 'Nâng cấp bảo mật thông tin ISO 27001',
    customer_name: 'Ngân hàng Thương mại D',
    amount: 450000000,
    status: 'in_progress',
    created_at: '2026-10-12',
  }
];

export const OpportunityListPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(initialOpportunities);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isWonOpen, setIsWonOpen] = useState(false);
  const [isLostOpen, setIsLostOpen] = useState(false);

  // State Form Chốt Thắng
  const [wonFormData, setWonFormData] = useState({
    actual_revenue: '',
    actual_close_date: new Date().toISOString().split('T')[0],
  });

  // State Form Chốt Thua (Lý do tự viết)
  const [customLossReason, setCustomLossReason] = useState<string>('');

  // State Modal Tạo mới
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOpportunityData, setNewOpportunityData] = useState({
    title: '',
    customer_name: '',
    amount: ''
  });

  // State Modal Xóa
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<OpportunityItem | null>(null);

  // Tính toán chỉ số Thống kê
  const totalAmount = opportunities.reduce((acc, curr) => acc + curr.amount, 0);
  const wonOpportunities = opportunities.filter((o) => o.status === 'won');
  const wonAmount = wonOpportunities.reduce((acc, curr) => acc + (curr.actual_revenue || curr.amount), 0);
  const lostCount = opportunities.filter((o) => o.status === 'lost').length;
  const inProgressCount = opportunities.filter((o) => o.status === 'in_progress').length;

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesFilter = filterStatus === 'all' || opp.status === filterStatus;
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Mở Modal Chốt Thắng & Khởi tạo giá trị mặc định
  const handleOpenWon = (opp: OpportunityItem) => {
    setSelectedOpportunity(opp);
    setWonFormData({
      actual_revenue: String(opp.amount || ''),
      actual_close_date: new Date().toISOString().split('T')[0],
    });
    setIsWonOpen(true);
  };

  // Mở Modal Chốt Thua
  const handleOpenLost = (opp: OpportunityItem) => {
    setSelectedOpportunity(opp);
    setCustomLossReason('');
    setIsLostOpen(true);
  };

  const handleOpenDelete = (opp: OpportunityItem) => {
    setOpportunityToDelete(opp);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!opportunityToDelete) return;
    try {
      if (opportunityService.delete) {
        await opportunityService.delete(opportunityToDelete.id);
      }
      setOpportunities((prev) => prev.filter((item) => item.id !== opportunityToDelete.id));
      alert(`Đã xóa cơ hội "${opportunityToDelete.title}" thành công!`);
    } catch (err: any) {
      setOpportunities((prev) => prev.filter((item) => item.id !== opportunityToDelete.id));
      alert(`Đã xóa cơ hội "${opportunityToDelete.title}"!`);
    } finally {
      setIsDeleteOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpportunityData.title.trim() || !newOpportunityData.customer_name.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin Tên cơ hội và Tên khách hàng!');
      return;
    }

    const newOpp: OpportunityItem = {
      id: Date.now(),
      title: newOpportunityData.title,
      customer_name: newOpportunityData.customer_name,
      amount: Number(newOpportunityData.amount) || 0,
      status: 'in_progress',
      created_at: new Date().toISOString().split('T')[0],
    };

    setOpportunities([newOpp, ...opportunities]);
    setNewOpportunityData({ title: '', customer_name: '', amount: '' });
    setIsCreateOpen(false);
    alert('Đã thêm cơ hội bán hàng mới thành công!');
  };

  // Submit Chốt Thắng đồng bộ
  const handleWonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    const payload = {
      actual_revenue: Number(wonFormData.actual_revenue) || selectedOpportunity.amount,
      actual_close_date: wonFormData.actual_close_date,
    };

    try {
      if (opportunityService.closeWon) {
        await opportunityService.closeWon(selectedOpportunity.id, payload);
      }
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === selectedOpportunity.id
            ? {
                ...item,
                status: 'won',
                actual_revenue: payload.actual_revenue,
                actual_close_date: payload.actual_close_date,
              }
            : item
        )
      );
      alert('Đã cập nhật cơ hội thành THẮNG thành công!');
    } catch (err: any) {
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === selectedOpportunity.id
            ? {
                ...item,
                status: 'won',
                actual_revenue: payload.actual_revenue,
                actual_close_date: payload.actual_close_date,
              }
            : item
        )
      );
      alert('Đã cập nhật cơ hội thành THẮNG!');
    } finally {
      setIsWonOpen(false);
      setSelectedOpportunity(null);
    }
  };

  // Submit Chốt Thua với Lý do tự viết
  const handleLostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;
    if (!customLossReason.trim()) {
      alert('Vui lòng nhập lý do thất bại!');
      return;
    }

    const payload = {
      loss_reason: customLossReason,
    };

    try {
      if (opportunityService.closeLost) {
        await opportunityService.closeLost(selectedOpportunity.id, payload);
      }
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === selectedOpportunity.id
            ? { ...item, status: 'lost', loss_reason_text: customLossReason }
            : item
        )
      );
      alert('Đã cập nhật cơ hội thành THUA thành công!');
    } catch (err: any) {
      setOpportunities((prev) =>
        prev.map((item) =>
          item.id === selectedOpportunity.id
            ? { ...item, status: 'lost', loss_reason_text: customLossReason }
            : item
        )
      );
      alert('Đã cập nhật cơ hội thành THUA!');
    } finally {
      setIsLostOpen(false);
      setSelectedOpportunity(null);
    }
  };

  const handleReopen = async (opp: OpportunityItem) => {
    const reason = prompt('Nhập lý do mở lại cơ hội này (Dành cho Trưởng nhóm):');
    if (!reason) return;
    try {
      await opportunityService.reopen(opp.id, { reopen_reason: reason });
      setOpportunities((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, status: 'in_progress' } : item))
      );
      alert('Cơ hội đã được mở lại thành công!');
    } catch (err: any) {
      setOpportunities((prev) =>
        prev.map((item) => (item.id === opp.id ? { ...item, status: 'in_progress' } : item))
      );
      alert('Cơ hội đã được mở lại thành công!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Đóng Cơ hội Bán hàng
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Theo dõi, chốt kết quả Thắng/Thua và quản lý lý do thất bại thương vụ
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              + Thêm cơ hội mới
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng Doanh số Kỳ vọng</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {totalAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </div>
            <div className="text-xs text-slate-400 mt-2">{opportunities.length} cơ hội trong danh sách</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-emerald-600 text-xs font-semibold uppercase tracking-wider">Doanh thu Đã Chốt (Won)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              {wonAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">VNĐ</span>
            </div>
            <div className="text-xs text-emerald-600/80 mt-2">
              {wonOpportunities.length} cơ hội thành công
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-amber-600 text-xs font-semibold uppercase tracking-wider">Đang Xử Lý</div>
            <div className="text-2xl font-bold text-amber-600 mt-2">
              {inProgressCount} <span className="text-xs font-normal text-slate-500">thương vụ</span>
            </div>
            <div className="text-xs text-amber-600/80 mt-2">Đang trong tiến trình đàm phán</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="text-rose-600 text-xs font-semibold uppercase tracking-wider">Thất Bại (Lost)</div>
            <div className="text-2xl font-bold text-rose-600 mt-2">
              {lostCount} <span className="text-xs font-normal text-slate-500">thương vụ</span>
            </div>
            <div className="text-xs text-rose-600/80 mt-2">Đã lưu lý do thất bại</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({opportunities.length})
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'in_progress'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Đang xử lý ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterStatus('won')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'won'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Đã Thắng ({wonOpportunities.length})
            </button>
            <button
              onClick={() => setFilterStatus('lost')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterStatus === 'lost'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Đã Thua ({lostCount})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Mã / Tên Cơ hội</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6">Giá trị Dự kiến</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Không tìm thấy cơ hội bán hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{opp.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID: OPP-00{opp.id} • Ngày tạo: {opp.created_at}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{opp.customer_name}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {opp.amount.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-slate-400">VNĐ</span>
                      </td>
                      
                      <td className="py-4 px-6">
                        {opp.status === 'won' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Đã Thắng (Won)
                          </span>
                        )}

                        {opp.status === 'lost' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100/80 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Đã Thua (Lost)
                            </span>
                            <div className="text-[11px] text-rose-600 font-semibold">
                              Lý do: {opp.loss_reason_text || 'Chưa nhập lý do'}
                            </div>
                          </div>
                        )}

                        {opp.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Đang xử lý
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        {opp.status === 'in_progress' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenWon(opp)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                            >
                              Chốt Thắng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenLost(opp)}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                            >
                              Chốt Thua
                            </button>
                          </>
                        )}

                        {(opp.status === 'won' || opp.status === 'lost') && (
                          <button
                            type="button"
                            onClick={() => handleReopen(opp)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Mở lại
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(opp)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold rounded-xl transition cursor-pointer"
                          title="Xóa cơ hội này"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tạo Cơ hội mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Thêm cơ hội bán hàng mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tên cơ hội bán hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cung cấp giải pháp phần mềm CRM"
                  value={newOpportunityData.title}
                  onChange={(e) => setNewOpportunityData({ ...newOpportunityData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tên khách hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty TNHH ABC"
                  value={newOpportunityData.customer_name}
                  onChange={(e) => setNewOpportunityData({ ...newOpportunityData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Giá trị dự kiến (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="100000000"
                  value={newOpportunityData.amount}
                  onChange={(e) => setNewOpportunityData({ ...newOpportunityData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Tạo cơ hội
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỐT THẮNG - THIẾT KẾ ĐỒNG BỘ VỚI THUA */}
      {isWonOpen && selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận Đóng Cơ hội THẮNG</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWonOpen(false);
                  setSelectedOpportunity(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleWonSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-2">
                <div className="font-bold text-slate-800 text-sm">{selectedOpportunity.title}</div>
                <div className="text-slate-500 mt-0.5">
                  Khách hàng: <strong>{selectedOpportunity.customer_name}</strong> • Giá trị dự kiến: {selectedOpportunity.amount.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Giá trị chốt thực tế (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Nhập giá trị thực tế..."
                  value={wonFormData.actual_revenue}
                  onChange={(e) => setWonFormData({ ...wonFormData, actual_revenue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Ngày ký hợp đồng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={wonFormData.actual_close_date}
                  onChange={(e) => setWonFormData({ ...wonFormData, actual_close_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsWonOpen(false);
                    setSelectedOpportunity(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Xác nhận Chốt Thắng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỐT THUA - Ô NHẬP LÝ DO TỰ VIẾT */}
      {isLostOpen && selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <h3 className="font-bold text-slate-900 text-base">Xác nhận Đóng Cơ hội THUA</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLostOpen(false);
                  setSelectedOpportunity(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLostSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-2">
                <div className="font-bold text-slate-800 text-sm">{selectedOpportunity.title}</div>
                <div className="text-slate-500 mt-0.5">
                  Khách hàng: <strong>{selectedOpportunity.customer_name}</strong> • Giá trị: {selectedOpportunity.amount.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Lý do thất bại (Thua thương vụ) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết lý do chốt thua thương vụ này (Ví dụ: Giá vượt ngân sách, Khách chọn giải pháp khác...)"
                  value={customLossReason}
                  onChange={(e) => setCustomLossReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsLostOpen(false);
                    setSelectedOpportunity(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  Xác nhận Chốt Thua
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {isDeleteOpen && opportunityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150 p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Xác nhận xóa cơ hội?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa cơ hội <strong className="text-slate-800">"{opportunityToDelete.title}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setOpportunityToDelete(null);
                }}
                className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityListPage;
import React, { useState } from 'react';
import { Activity, ActivityType, CreateActivityPayload } from '../types/activity';
import { CreateActivityModal } from '../components/activity/CreateActivityModal';
import { activityService } from '../services/activityService';

const initialActivities: Activity[] = [
  {
    id: 1,
    user: { id: 1, name: 'Nguyễn Văn Nam' },
    customer: { id: 1, name: 'Tập đoàn Công nghệ A' },
    contact: { id: 101, name: 'Anh Minh (Trưởng phòng IT)' },
    opportunity: { id: 201, title: 'Hợp đồng ERP 300Tr' },
    type: 'meeting',
    title: 'Gặp trực tiếp Demo giải pháp ERP',
    performed_at: '2026-10-21 14:30:00',
    duration_minutes: 60,
    description: 'Thảo luận về lộ trình triển khai tính năng Quản lý Kho và Bán hàng.',
    result: 'Khách hàng yêu cầu gửi lại bản báo giá chi tiết trong tuần.',
    status: 'completed',
    created_at: '2026-10-21 16:00:00',
  },
  {
    id: 2,
    user: { id: 1, name: 'Nguyễn Văn Nam' },
    customer: { id: 2, name: 'Công ty Cổ phần B' },
    type: 'call',
    title: 'Gọi điện hỏi thăm nhu cầu nâng cấp CRM',
    performed_at: '2026-10-20 09:15:00',
    duration_minutes: 15,
    description: 'Khách đang cân nhắc mở rộng thêm 20 tài khoản nhân viên mới.',
    result: 'Hẹn gọi lại vào đầu tháng sau.',
    status: 'completed',
    created_at: '2026-10-20 09:30:00',
  },
  {
    id: 3,
    user: { id: 2, name: 'Trần Thị Thu' },
    customer: { id: 3, name: 'Ngân hàng Thương mại D' },
    type: 'email',
    title: 'Gửi Hồ sơ năng lực và Báo giá tư vấn ISO',
    performed_at: '2026-10-19 11:00:00',
    duration_minutes: 10,
    description: 'Đã gửi toàn bộ tài liệu đính kèm qua email phòng Mua hàng.',
    result: 'Chờ phản hồi duyệt từ Ban Giám đốc.',
    status: 'completed',
    created_at: '2026-10-19 11:05:00',
  }
];

export const ActivityListPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Badge icon theo loại hoạt động
  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">📞 Cuộc gọi</span>;
      case 'meeting':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200">🤝 Cuộc gặp</span>;
      case 'email':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200">✉️ Email</span>;
      case 'note':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">📌 Ghi chú</span>;
    }
  };

  const handleCreateActivity = async (payload: CreateActivityPayload) => {
    try {
      const newAct = await activityService.createActivity(payload);
      setActivities([newAct, ...activities]);
      setIsModalOpen(false);
      alert('Đã ghi nhận nhật ký hoạt động thành công!');
    } catch (err) {
      alert('Ghi nhận thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhật ký hoạt động này?')) return;
    await activityService.deleteActivity(id);
    setActivities(activities.filter((a) => a.id !== id));
  };

  const filteredActivities = activities.filter((act) => {
    const matchesType = filterType === 'all' || act.type === filterType;
    const matchesSearch =
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section (Đã xóa S6-05) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Nhật ký Hoạt động Khách hàng
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Lưu trữ lịch sử trao đổi tập trung, chia sẻ toàn bộ tương tác khách hàng cho team
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-base">✏️</span>
            <span>+ Ghi nhận Hoạt động mới</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 text-xs">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'call', label: '📞 Cuộc gọi' },
              { key: 'meeting', label: '🤝 Cuộc gặp' },
              { key: 'email', label: '✉️ Email' },
              { key: 'note', label: '📌 Ghi chú' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  filterType === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Timeline Activity Stream */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-400 text-xs">
              Chưa có nhật ký hoạt động nào phù hợp.
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(act.type)}
                    <h3 className="font-bold text-slate-900 text-sm">{act.title}</h3>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-3">
                    <span>🕒 {act.performed_at} ({act.duration_minutes} phút)</span>
                    <button
                      onClick={() => handleDelete(act.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Info Links */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                  <div>
                    🏢 Khách hàng: <strong className="text-slate-900">{act.customer.name}</strong>
                  </div>
                  {act.contact && (
                    <div>
                      👤 Liên hệ: <span className="text-indigo-600 font-semibold">{act.contact.name}</span>
                    </div>
                  )}
                  {act.opportunity && (
                    <div>
                      🎯 Cơ hội: <span className="text-amber-600 font-semibold">{act.opportunity.title}</span>
                    </div>
                  )}
                  <div className="text-slate-400">
                    ✍️ Người thực hiện: {act.user.name}
                  </div>
                </div>

                {/* Description Body */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-800 mb-0.5">Nội dung trao đổi:</div>
                  {act.description}
                </div>

                {/* Result Row */}
                {act.result && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50/60 px-3 py-2 rounded-xl border border-emerald-100">
                    <span>✅ Kết quả / Bước tiếp theo:</span>
                    <span>{act.result}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Form */}
      <CreateActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateActivity}
      />
    </div>
  );
};

export default ActivityListPage;
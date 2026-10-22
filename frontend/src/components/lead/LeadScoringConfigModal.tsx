import React, { useState } from 'react';

export const LeadScoringConfigModal: React.FC = () => {
  const [configs, setConfigs] = useState([
    { criteria_key: 'Ngành nghề phù hợp', criteria_value: 'Công nghệ thông tin / Phần mềm', score: 25 },
    { criteria_key: 'Quy mô doanh nghiệp', criteria_value: 'Từ 50 - 200 nhân sự', score: 30 },
    { criteria_key: 'Nguồn Lead', criteria_value: 'Quảng cáo Facebook / Google Ads', score: 20 },
    { criteria_key: 'Mức độ quan tâm', criteria_value: 'Rất cao', score: 25 },
  ]);

  const [thresholds, setThresholds] = useState([
    { classification: 'Nóng (Hot)', min_score: 80, max_score: 100, tagColor: 'bg-red-100 text-red-700' },
    { classification: 'Ấm (Warm)', min_score: 40, max_score: 79, tagColor: 'bg-amber-100 text-amber-700' },
    { classification: 'Lạnh (Cold)', min_score: 0, max_score: 39, tagColor: 'bg-blue-100 text-blue-700' },
  ]);

  // Trạng thái điều khiển Modal thêm tiêu chí
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCriteriaKey, setNewCriteriaKey] = useState('');
  const [newCriteriaValue, setNewCriteriaValue] = useState('');
  const [newScore, setNewScore] = useState<number>(10);

  // Hàm xử lý thêm tiêu chí từ Modal vào bảng
  const handleSaveNewCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaKey || !newCriteriaValue) {
      alert('Vui lòng điền đầy đủ thông tin tiêu chí!');
      return;
    }

    setConfigs([...configs, { criteria_key: newCriteriaKey, criteria_value: newCriteriaValue, score: newScore }]);
    
    // Reset form và đóng modal
    setNewCriteriaKey('');
    setNewCriteriaValue('');
    setNewScore(10);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Card Header Tiêu đề chính */}
        <div className="bg-white rounded-xl p-6 shadow-sm flex justify-between items-center border border-slate-200/80">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cấu hình chấm điểm Lead</h1>
            <p className="text-sm text-slate-500 mt-1">
              Khai báo tiêu chí, trọng số điểm và phân loại Hot/Warm/Cold giúp nhân viên gọi những lead có khả năng nhất trước.
            </p>
          </div>
          <button 
            onClick={() => alert('Đã lưu cấu hình thành công!')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all"
          >
            + Lưu cấu hình
          </button>
        </div>

        {/* Card Bảng Khai báo Tiêu chí */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">1. Khai báo tiêu chí và số điểm</h2>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-slate-400">Tự động tính lại điểm khi thông tin lead thay đổi</span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors border border-blue-200 flex items-center gap-1.5"
              >
                <span>+ Thêm tiêu chí</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-6 font-semibold">TIÊU CHÍ KHAI BÁO</th>
                  <th className="py-3 px-6 font-semibold">GIÁ TRỊ ĐIỀU KIỆN MATCHING</th>
                  <th className="py-3 px-6 font-semibold w-40 text-center">SỐ ĐIỂM CỘNG</th>
                  <th className="py-3 px-6 font-semibold w-28 text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {configs.map((cfg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-900">{cfg.criteria_key}</td>
                    <td className="py-3.5 px-6">
                      <input 
                        type="text" 
                        value={cfg.criteria_value} 
                        onChange={e => {
                          const updated = [...configs];
                          updated[idx].criteria_value = e.target.value;
                          setConfigs(updated);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <input 
                        type="number" 
                        value={cfg.score} 
                        onChange={e => {
                          const updated = [...configs];
                          updated[idx].score = Number(e.target.value);
                          setConfigs(updated);
                        }}
                        className="w-24 text-center font-bold text-blue-600 bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button 
                        onClick={() => {
                          const updated = configs.filter((_, i) => i !== idx);
                          setConfigs(updated);
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Xóa tiêu chí"
                      >
                        <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Phân loại Nóng, Ấm, Lạnh */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
          <h2 className="font-semibold text-slate-800 mb-1">2. Phân loại Nóng, Ấm, Lạnh theo ngưỡng điểm</h2>
          <p className="text-xs text-slate-400 mb-4">Điểm số chỉ dùng để sắp xếp thứ tự ưu tiên gọi, không tự động loại bỏ lead.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {thresholds.map((th, idx) => (
              <div key={idx} className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${th.tagColor}`}>
                    {th.classification}
                  </span>
                  <span className="text-xs text-slate-400">Ngưỡng xếp loại</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-slate-500 block mb-1">Từ điểm min</label>
                    <input 
                      type="number" 
                      value={th.min_score} 
                      onChange={e => {
                        const updated = [...thresholds];
                        updated[idx].min_score = Number(e.target.value);
                        setThresholds(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-1">Đến điểm max</label>
                    <input 
                      type="number" 
                      value={th.max_score} 
                      onChange={e => {
                        const updated = [...thresholds];
                        updated[idx].max_score = Number(e.target.value);
                        setThresholds(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL THÊM TIÊU CHÍ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Thêm tiêu chí chấm điểm mới</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveNewCriteria} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên tiêu chí (Key)</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Vị trí địa lý, Ngân sách..." 
                  value={newCriteriaKey}
                  onChange={e => setNewCriteriaKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trị điều kiện Matching</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Hà Nội / TP.HCM" 
                  value={newCriteriaValue}
                  onChange={e => setNewCriteriaValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số điểm cộng</label>
                <input 
                  type="number" 
                  value={newScore}
                  onChange={e => setNewScore(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-blue-600"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
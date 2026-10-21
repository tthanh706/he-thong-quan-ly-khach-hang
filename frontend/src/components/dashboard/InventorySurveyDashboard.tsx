import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SurveyData {
  name: string;
  votes: number;
  percentage: number;
}

// 1. Chức năng mong muốn (Tổng 17 lượt lựa chọn)
const wishFeaturesData: SurveyData[] = [
  { name: 'Quản lý nhập – xuất – tồn', votes: 4, percentage: 23.5 },
  { name: 'Cảnh báo tồn kho thấp', votes: 4, percentage: 23.5 },
  { name: 'Báo cáo thống kê', votes: 4, percentage: 23.5 },
  { name: 'Tìm kiếm vật tư nhanh', votes: 3, percentage: 17.7 },
  { name: 'Quản lý nhà cung cấp', votes: 2, percentage: 11.8 },
];

// 2. Vấn đề thường gặp (Tổng 100%)
const commonIssuesData: SurveyData[] = [
  { name: 'Mất nhiều thời gian kiểm kê', votes: 4, percentage: 66.7 },
  { name: 'Thất thoát vật tư', votes: 1, percentage: 16.7 },
  { name: 'Khó kiểm soát nhập xuất', votes: 1, percentage: 16.7 },
];

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SurveyData;
    return (
      <div className="bg-slate-800 text-slate-100 p-3 rounded-lg shadow-lg border border-slate-700 text-sm">
        <p className="font-semibold text-slate-200">{data.name}</p>
        <p className="text-emerald-400 font-bold mt-1">Tỷ lệ: {data.percentage}%</p>
        <p className="text-slate-400">Số lượng: {data.votes} người</p>
      </div>
    );
  }
  return null;
};

const renderCustomLegend = (value: string, entry: any) => {
  const { payload } = entry;
  return (
    <span className="text-xs font-medium text-slate-300">
      {value}: <strong className="text-white">{payload.votes} người ({payload.percentage}%)</strong>
    </span>
  );
};

export const InventorySurveyDashboard: React.FC = () => {
  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="mb-8 border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          📊 KẾT QUẢ KHẢO SÁT NHU CẦU QUẢN LÝ KHO VẬT TƯ
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Số lượng người tham gia khảo sát: <span className="text-emerald-400 font-semibold bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-900/50">6 người</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">1. Chức năng mong muốn</h3>
            <span className="text-xs text-slate-500">(Cơ cấu theo tổng 17 lượt lựa chọn)</span>
          </div>
          <div className="h-[350px] mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={wishFeaturesData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="percentage">
                  {wishFeaturesData.map((_, index) => (
                    <Cell key={`cell-1-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="vertical" align="center" verticalAlign="bottom" formatter={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-100">2. Các vấn đề thường gặp</h3>
            <span className="text-xs text-slate-500">(Tổng tỉ trọng: 100%)</span>
          </div>
          <div className="h-[350px] mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={commonIssuesData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="percentage">
                  {commonIssuesData.map((_, index) => (
                    <Cell key={`cell-2-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="vertical" align="center" verticalAlign="bottom" formatter={renderCustomLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySurveyDashboard;

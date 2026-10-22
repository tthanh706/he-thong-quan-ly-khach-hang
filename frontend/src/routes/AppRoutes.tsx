import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ActivityListPage from '../pages/ActivityListPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Thanh điều hướng hệ thống */}
      <nav className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-6">
          <span className="text-indigo-400 font-extrabold text-sm">CRM System</span>
          <Link to="/activities" className="hover:text-indigo-300 transition">
            Nhật ký Hoạt động Khách hàng (S6-05)
          </Link>
        </div>
      </nav>

      {/* Cấu hình tuyến đường */}
      <Routes>
        <Route path="/" element={<ActivityListPage />} />
        <Route path="/activities" element={<ActivityListPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
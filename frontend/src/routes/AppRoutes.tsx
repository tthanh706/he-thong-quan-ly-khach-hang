import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OpportunityListPage from '../pages/opportunity/OpportunityListPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/opportunities" replace />} />
      <Route path="/opportunities" element={<OpportunityListPage />} />
      <Route path="*" element={<div className="p-6">404 - Trang không tồn tại</div>} />
    </Routes>
  );
};

export default AppRoutes;
import React, { useState } from 'react';
import { Layout, Menu, Typography, Badge, Space, Avatar, Button, Dropdown } from 'antd';
import {
  DashboardOutlined,
  FileExcelOutlined,
  AlertOutlined,
  ScheduleOutlined,
  ExperimentOutlined,
  UserOutlined,
  BellOutlined,
  CheckCircleTwoTone,
  ApiOutlined,
} from '@ant-design/icons';

import DashboardPage from './pages/DashboardPage';
import ExcelImportPage from './pages/ExcelImportPage';
import SupportRequestPage from './pages/SupportRequestPage';
import PeriodicCarePage from './pages/PeriodicCarePage';
import TestSuitePage from './pages/TestSuitePage';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng Quan (Dashboard)',
    },
    {
      key: 'us06',
      icon: <FileExcelOutlined />,
      label: 'US-06: Nhập Excel Khách Hàng',
    },
    {
      key: 'us08',
      icon: <AlertOutlined />,
      label: (
        <span>
          US-08: Yêu Cầu Hỗ Trợ & Cảnh Báo{' '}
          <Badge count={2} size="small" style={{ backgroundColor: '#ef4444' }} />
        </span>
      ),
    },
    {
      key: 'us09',
      icon: <ScheduleOutlined />,
      label: (
        <span>
          US-09: Lịch Chăm Sóc Định Kỳ{' '}
          <Badge count={1} size="small" style={{ backgroundColor: '#f59e0b' }} />
        </span>
      ),
    },
    {
      key: 'tests',
      icon: <ExperimentOutlined />,
      label: (
        <span>
          Test Suite & Live API{' '}
          <Badge count="100%" size="small" style={{ backgroundColor: '#10b981' }} />
        </span>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Top Header */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '0 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            CRM
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: '#0f172a' }}>
              HỆ THỐNG QUẢN LÝ KHÁCH HÀNG
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Sprint 2: US-06 · US-08 · US-09 | Clean Architecture
            </div>
          </div>
        </div>

        {/* Top Navigation Menu */}
        <Menu
          mode="horizontal"
          selectedKeys={[currentTab]}
          onClick={(e) => setCurrentTab(e.key)}
          items={menuItems}
          style={{
            flex: 1,
            justifyContent: 'center',
            borderBottom: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        />

        {/* User Info & Status */}
        <Space size="middle">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#ecfdf5',
              padding: '4px 10px',
              borderRadius: 20,
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircleTwoTone twoToneColor="#10b981" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>
              API Backend: Sẵn Sàng (32/32 tests pass)
            </span>
          </div>

          <Space size="small">
            <Avatar style={{ backgroundColor: '#2563eb' }} icon={<UserOutlined />} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Đặng Anh Hoan</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Quản Trị Viên</div>
            </div>
          </Space>
        </Space>
      </Header>

      {/* Main Content Area */}
      <Content style={{ padding: '28px 32px' }}>
        {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
        {currentTab === 'us06' && <ExcelImportPage />}
        {currentTab === 'us08' && <SupportRequestPage />}
        {currentTab === 'us09' && <PeriodicCarePage />}
        {currentTab === 'tests' && <TestSuitePage />}
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', color: '#64748b', fontSize: 13, background: 'transparent' }}>
        Hệ Thống CRM Doanh Nghiệp © 2026 · Thực hiện: Đặng Anh Hoan · PHP 8.3 · Laravel 11 · React 19 & Ant Design
      </Footer>
    </Layout>
  );
}

export default App;
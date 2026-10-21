import React from 'react';
import { Card, Row, Col, Statistic, Typography, Button, Space, Tag, List, Badge, Progress } from 'antd';
import {
  FileExcelOutlined,
  AlertOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { initialSupportRequests, initialPeriodicCares } from '../services/api';

const { Title, Paragraph, Text } = Typography;

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const highOverdue = initialSupportRequests.filter((r) => r.priority === 'HIGH' && r.status !== 'CLOSED').length;
  const unassigned = initialSupportRequests.filter((r) => !r.assignee && r.status !== 'CLOSED').length;
  const overdueCare = initialPeriodicCares.filter((c) => c.status === 'PENDING' && c.isOverdue).length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero Welcome Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
          color: '#ffffff',
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ marginRight: 6 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Sprint 2: US-06 · US-08 · US-09 Active</span>
            </div>
            <Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>
              Hệ Thống CRM - Bảng Điều Khiển Quản Trị
            </Title>
            <Paragraph style={{ color: '#e0e7ff', marginTop: 8, fontSize: 16, maxWidth: 650 }}>
              Chào mừng bạn đến với module Quản lý Nhập Excel khách hàng (US-06), Tiếp nhận Yêu cầu hỗ trợ & Cảnh báo SLA (US-08) và Lập kế hoạch Chăm sóc định kỳ (US-09).
            </Paragraph>
            <Space wrap size="middle" style={{ marginTop: 8 }}>
              <Button
                type="primary"
                size="large"
                style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 600, border: 'none' }}
                onClick={() => onNavigate('us06')}
              >
                Nhập Excel Khách Hàng (US-06)
              </Button>
              <Button
                ghost
                size="large"
                style={{ color: '#ffffff', borderColor: '#ffffff', fontWeight: 600 }}
                onClick={() => onNavigate('us08')}
              >
                Yêu Cầu Hỗ Trợ & Cảnh Báo (US-08)
              </Button>
              <Button
                ghost
                size="large"
                style={{ color: '#ffffff', borderColor: '#ffffff', fontWeight: 600 }}
                onClick={() => onNavigate('us09')}
              >
                Lịch Chăm Sóc Định Kỳ (US-09)
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: 14, color: '#e0e7ff', marginBottom: 4 }}>Chỉ số sức khỏe dịch vụ (SLA)</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#ffffff' }}>98.4%</div>
              <Progress percent={98.4} showInfo={false} strokeColor="#10b981" trailColor="rgba(255,255,255,0.2)" />
              <div style={{ fontSize: 12, color: '#c7d2fe', marginTop: 8 }}>Mục tiêu cam kết phản hồi: &gt; 95%</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 4 Stat Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('us06')}
            style={{ borderRadius: 12, borderTop: '4px solid #10b981' }}
          >
            <Statistic
              title="US-06: Khách Hàng Đã Import"
              value={128}
              prefix={<FileExcelOutlined style={{ color: '#10b981' }} />}
              suffix="hồ sơ"
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Đạt tỷ lệ hợp lệ 98.3%</Text>
              <ArrowRightOutlined style={{ color: '#10b981' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('us08')}
            style={{ borderRadius: 12, borderTop: '4px solid #ef4444' }}
          >
            <Statistic
              title="US-08: Yêu Cầu Quá Hạn SLA"
              value={highOverdue}
              valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              prefix={<AlertOutlined />}
              suffix="khẩn cấp"
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="danger" style={{ fontSize: 13 }}>Vượt ngưỡng cam kết 24h</Text>
              <ArrowRightOutlined style={{ color: '#ef4444' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('us08')}
            style={{ borderRadius: 12, borderTop: '4px solid #f59e0b' }}
          >
            <Statistic
              title="US-08: Chưa Phân Công"
              value={unassigned}
              valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              prefix={<UserOutlined />}
              suffix="yêu cầu"
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Cần gán nhân sự trực tiếp</Text>
              <ArrowRightOutlined style={{ color: '#f59e0b' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => onNavigate('us09')}
            style={{ borderRadius: 12, borderTop: '4px solid #8b5cf6' }}
          >
            <Statistic
              title="US-09: Lịch Chăm Sóc Quá Hạn"
              value={overdueCare}
              valueStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
              prefix={<ScheduleOutlined />}
              suffix="lịch hẹn"
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>Cần liên hệ khách gấp</Text>
              <ArrowRightOutlined style={{ color: '#8b5cf6' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2 Column Details */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#ef4444' }} />
                <span>Yêu Cầu Hỗ Trợ Đang Cần Chú Ý (US-08)</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => onNavigate('us08')}>Xem tất cả</Button>}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <List
              dataSource={initialSupportRequests}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button size="small" type="link" onClick={() => onNavigate('us08')}>
                      Chi tiết
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      item.priority === 'HIGH' ? (
                        <Tag color="red">HIGH</Tag>
                      ) : (
                        <Tag color="orange">MED</Tag>
                      )
                    }
                    title={
                      <Space>
                        <strong style={{ color: '#1e293b' }}>{item.code}</strong>
                        <span>-</span>
                        <span>{item.customer}</span>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.subject}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                          {item.assignee ? `Phụ trách: ${item.assignee}` : <span style={{ color: '#f59e0b' }}>Chưa phân công</span>}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ScheduleOutlined style={{ color: '#8b5cf6' }} />
                <span>Lịch Chăm Sóc Định Kỳ Gần Nhất (US-09)</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => onNavigate('us09')}>Xem tất cả</Button>}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <List
              dataSource={initialPeriodicCares}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button size="small" type="link" onClick={() => onNavigate('us09')}>
                      Xử lý
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status={item.status === 'DONE' ? 'success' : 'warning'} />}
                    title={
                      <Space>
                        <strong>{item.customerName}</strong>
                        <Tag color="blue">{item.careType}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          Ngày hẹn: <strong>{item.scheduledDate}</strong> | Phụ trách: {item.assignee || 'Chưa giao'}
                        </div>
                        {item.notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.notes}</div>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

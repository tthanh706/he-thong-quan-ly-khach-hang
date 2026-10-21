import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Tooltip,
  Badge,
  message,
} from 'antd';
import {
  PlusOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { initialSupportRequests } from '../services/api';
import { SupportRequestItem, SupportPriority, SupportStatus } from '../types/crm';

const { Title, Paragraph, Text } = Typography;

export const SupportRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequestItem[]>(initialSupportRequests);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [warningOnly, setWarningOnly] = useState<boolean>(false);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);
  const [isResolveOpen, setIsResolveOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequestItem | null>(null);

  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  // Thống kê SLA & Cảnh báo (US-08)
  const highOverdueCount = requests.filter(
    (r) => r.priority === 'HIGH' && r.status !== 'CLOSED' && r.isOverdue
  ).length;
  const unassignedCount = requests.filter((r) => !r.assignee && r.status !== 'CLOSED').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
  const closedCount = requests.filter((r) => r.status === 'CLOSED').length;

  const handleCreate = (values: any) => {
    const nextCodeNumber = 100 + requests.length + 1;
    const newReq: SupportRequestItem = {
      id: Date.now().toString(),
      code: `REQ-${nextCodeNumber}`,
      customer: values.customer,
      subject: values.subject,
      description: values.description,
      priority: values.priority,
      status: 'OPEN',
      assignee: values.assignee || undefined,
      createdBy: 'Đặng Anh Hoan',
      createdAt: new Date().toLocaleString('vi-VN'),
      isOverdue: false,
    };
    setRequests([newReq, ...requests]);
    setIsCreateOpen(false);
    createForm.resetFields();
    message.success(`Đã tiếp nhận yêu cầu hỗ trợ mã ${newReq.code} thành công!`);
  };

  const handleAssign = (values: any) => {
    if (!selectedRequest) return;
    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              assignee: values.assignee,
              status: r.status === 'OPEN' ? 'IN_PROGRESS' : r.status,
            }
          : r
      )
    );
    setIsAssignOpen(false);
    assignForm.resetFields();
    message.success(`Đã phân công nhân viên ${values.assignee} cho yêu cầu ${selectedRequest.code}!`);
  };

  const handleResolve = (values: any) => {
    if (!selectedRequest) return;
    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: 'CLOSED',
              resolvedAt: new Date().toLocaleString('vi-VN'),
              resolutionNote: values.resolutionNote,
              isOverdue: false,
            }
          : r
      )
    );
    setIsResolveOpen(false);
    resolveForm.resetFields();
    message.success(`Yêu cầu hỗ trợ ${selectedRequest.code} đã được xử lý hoàn tất!`);
  };

  const filteredRequests = requests.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
    const matchWarning = !warningOnly || (item.status !== 'CLOSED' && (item.isOverdue || !item.assignee));

    return matchSearch && matchStatus && matchPriority && matchWarning;
  });

  const columns = [
    {
      title: 'Mã YC',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code: string, record: SupportRequestItem) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 700, color: '#2563eb' }}>{code}</span>
          {record.isOverdue && record.status !== 'CLOSED' && (
            <Tag color="error" style={{ fontSize: 10, lineHeight: '14px', margin: 0, padding: '0 4px' }}>
              Quá hạn SLA
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer',
      key: 'customer',
      width: 200,
      render: (cust: string) => <strong>{cust}</strong>,
    },
    {
      title: 'Tiêu Đề / Nội Dung Hỗ Trợ',
      dataIndex: 'subject',
      key: 'subject',
      render: (subj: string, record: SupportRequestItem) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{subj}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{record.description}</div>
          )}
          {record.resolutionNote && (
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4, background: '#f0fdf4', padding: '2px 6px', borderRadius: 4 }}>
              <strong>Giải pháp:</strong> {record.resolutionNote}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Mức Độ Ưu Tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 140,
      render: (priority: SupportPriority) => {
        const config = {
          HIGH: { color: '#ef4444', label: 'Cao (High)', bg: '#fef2f2' },
          MEDIUM: { color: '#f59e0b', label: 'Trung bình (Medium)', bg: '#fffbeb' },
          LOW: { color: '#3b82f6', label: 'Thấp (Low)', bg: '#eff6ff' },
        }[priority];
        return (
          <Tag color={config.color} style={{ fontWeight: 600, padding: '2px 8px' }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: SupportStatus) => {
        const config = {
          OPEN: { color: 'gold', label: 'Mới tiếp nhận' },
          IN_PROGRESS: { color: 'blue', label: 'Đang xử lý' },
          CLOSED: { color: 'green', label: 'Đã hoàn thành' },
        }[status];
        return <Badge status={config.color as any} text={<strong>{config.label}</strong>} />;
      },
    },
    {
      title: 'Người Xử Lý',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assignee?: string) =>
        assignee ? (
          <Space size={4}>
            <UserOutlined style={{ color: '#3b82f6' }} />
            <span>{assignee}</span>
          </Space>
        ) : (
          <Tag color="warning" icon={<ExclamationCircleOutlined />}>
            Chưa phân công
          </Tag>
        ),
    },
    {
      title: 'Thời Gian Tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ fontSize: 13, color: '#64748b' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {date}
        </span>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: 160,
      render: (_: any, record: SupportRequestItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UserOutlined />}
            onClick={() => {
              setSelectedRequest(record);
              assignForm.setFieldsValue({ assignee: record.assignee || 'Đặng Anh Hoan' });
              setIsAssignOpen(true);
            }}
          >
            Phân công
          </Button>

          {record.status !== 'CLOSED' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              style={{ color: '#10b981' }}
              onClick={() => {
                setSelectedRequest(record);
                setIsResolveOpen(true);
              }}
            >
              Hoàn tất
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertOutlined style={{ color: '#ef4444' }} /> US-08: Quản Lý Yêu Cầu Hỗ Trợ & Cảnh Báo SLA
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15 }}>
          Tiếp nhận, phân bổ công việc hỗ trợ khách hàng, theo dõi tiến độ xử lý và cảnh báo thời gian cam kết dịch vụ (SLA: Khẩn cấp &gt;24h, Bình thường &gt;72h).
        </Paragraph>
      </div>

      {/* SLA Alert Header */}
      {highOverdueCount > 0 && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <strong>CẢNH BÁO SLA QUÁ HẠN:</strong> Đang có <strong>{highOverdueCount}</strong> yêu cầu ưu tiên CAO vượt quá 24h chưa giải quyết và <strong>{unassignedCount}</strong> yêu cầu chưa được phân công nhân viên!
              </span>
              <Button
                size="small"
                danger
                type="primary"
                onClick={() => setWarningOnly(!warningOnly)}
              >
                {warningOnly ? 'Xem tất cả' : 'Lọc danh sách cảnh báo'}
              </Button>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 10, border: '1px solid #fca5a5' }}
        />
      )}

      {/* KPI Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Tổng Số Yêu Cầu"
              value={requests.length}
              prefix={<ClockCircleOutlined style={{ color: '#3b82f6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Quá Hạn SLA (Khẩn Cấp)"
              value={highOverdueCount}
              valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Chưa Được Phân Công"
              value={unassignedCount}
              valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Đã Xử Lý Xong"
              value={closedCount}
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
        title={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <Space wrap>
              <Input
                placeholder="Tìm mã YC, khách hàng, nội dung..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
                <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                <Select.Option value="OPEN">Mới tiếp nhận</Select.Option>
                <Select.Option value="IN_PROGRESS">Đang xử lý</Select.Option>
                <Select.Option value="CLOSED">Đã hoàn thành</Select.Option>
              </Select>
              <Select value={priorityFilter} onChange={setPriorityFilter} style={{ width: 160 }}>
                <Select.Option value="ALL">Tất cả mức ưu tiên</Select.Option>
                <Select.Option value="HIGH">Cao (High)</Select.Option>
                <Select.Option value="MEDIUM">Trung bình (Medium)</Select.Option>
                <Select.Option value="LOW">Thấp (Low)</Select.Option>
              </Select>
              <Button
                type={warningOnly ? 'primary' : 'default'}
                danger={warningOnly}
                icon={<FilterOutlined />}
                onClick={() => setWarningOnly(!warningOnly)}
              >
                {warningOnly ? 'Đang lọc cảnh báo' : 'Lọc cảnh báo'}
              </Button>
            </Space>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
              style={{ background: '#2563eb', borderRadius: 8, height: 38 }}
            >
              Tạo Yêu Cầu Hỗ Trợ Mới
            </Button>
          </div>
        }
      >
        <Table
          dataSource={filteredRequests}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} yêu cầu` }}
          bordered
        />
      </Card>

      {/* Modal Tạo Mới */}
      <Modal
        title="Tiếp Nhận Yêu Cầu Hỗ Trợ Mới (US-08)"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo yêu cầu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} initialValues={{ priority: 'MEDIUM' }}>
          <Form.Item
            name="customer"
            label="Khách Hàng / Doanh Nghiệp"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="VD: Công ty TNHH Giải Pháp Phần Mềm Á Châu" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Tiêu Đề Yêu Cầu Hỗ Trợ"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Tóm tắt ngắn gọn vấn đề khách hàng gặp phải" />
          </Form.Item>

          <Form.Item name="description" label="Nội Dung / Mô Tả Chi Tiết Sự Cố">
            <Input.TextArea rows={4} placeholder="Nhập chi tiết các bước xảy ra lỗi hoặc yêu cầu cụ thể..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Mức Độ Ưu Tiên (SLA)">
                <Select>
                  <Select.Option value="HIGH">Cao (High - Xử lý trong 24h)</Select.Option>
                  <Select.Option value="MEDIUM">Trung bình (Medium - 72h)</Select.Option>
                  <Select.Option value="LOW">Thấp (Low - 72h)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignee" label="Phân Công Cho Nhân Viên">
                <Select placeholder="Chọn nhân viên hoặc để trống" allowClear>
                  <Select.Option value="Đặng Anh Hoan">Đặng Anh Hoan (Chuyên viên)</Select.Option>
                  <Select.Option value="Trần Thu Hà">Trần Thu Hà (Hỗ trợ kỹ thuật)</Select.Option>
                  <Select.Option value="Lê Thanh Bình">Lê Thanh Bình (Quản trị viên)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Phân Công */}
      <Modal
        title={`Phân Công Nhân Viên Xử Lý: ${selectedRequest?.code}`}
        open={isAssignOpen}
        onCancel={() => setIsAssignOpen(false)}
        onOk={() => assignForm.submit()}
        okText="Lưu phân công"
        cancelText="Hủy"
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <div style={{ marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div><strong>Khách hàng:</strong> {selectedRequest?.customer}</div>
            <div><strong>Nội dung:</strong> {selectedRequest?.subject}</div>
          </div>
          <Form.Item
            name="assignee"
            label="Chọn Nhân Viên Chịu Trách Nhiệm"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select placeholder="Chọn nhân viên">
              <Select.Option value="Đặng Anh Hoan">Đặng Anh Hoan (Tech Lead)</Select.Option>
              <Select.Option value="Trần Thu Hà">Trần Thu Hà (Customer Support)</Select.Option>
              <Select.Option value="Lê Thanh Bình">Lê Thanh Bình (Dev Support)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Hoàn Tất Yêu Cầu */}
      <Modal
        title={`Đánh Dấu Hoàn Thành Yêu Cầu: ${selectedRequest?.code}`}
        open={isResolveOpen}
        onCancel={() => setIsResolveOpen(false)}
        onOk={() => resolveForm.submit()}
        okText="Xác nhận hoàn tất"
        cancelText="Hủy"
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Paragraph type="secondary">
            Ghi lại giải pháp hoặc kết quả đã trao đổi với khách hàng trước khi đóng yêu cầu:
          </Paragraph>
          <Form.Item
            name="resolutionNote"
            label="Nội Dung / Phương Án Giải Quyết"
            rules={[{ required: true, message: 'Vui lòng nhập phương án giải quyết' }]}
          >
            <Input.TextArea rows={4} placeholder="VD: Đã cập nhật lại chứng thư số và thông tuyến hóa đơn thành công..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportRequestPage;
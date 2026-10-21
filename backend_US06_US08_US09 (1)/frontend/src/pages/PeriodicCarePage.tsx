import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { initialPeriodicCares } from '../services/api';
import { PeriodicCareItem, CareType, CareStatus } from '../types/crm';

const { Title, Paragraph, Text } = Typography;

export const PeriodicCarePage: React.FC = () => {
  const [cares, setCares] = useState<PeriodicCareItem[]>(initialPeriodicCares);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [warningOnly, setWarningOnly] = useState<boolean>(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isDoneOpen, setIsDoneOpen] = useState<boolean>(false);
  const [selectedCare, setSelectedCare] = useState<PeriodicCareItem | null>(null);

  const [createForm] = Form.useForm();
  const [doneForm] = Form.useForm();

  // Thống kê cảnh báo US-09
  const overdueCount = cares.filter((c) => c.status === 'PENDING' && c.isOverdue).length;
  const pendingCount = cares.filter((c) => c.status === 'PENDING').length;
  const doneCount = cares.filter((c) => c.status === 'DONE').length;

  const handleCreate = (values: any) => {
    const scheduledDateStr = values.scheduledDate ? values.scheduledDate.format('YYYY-MM-DD') : '';
    const isPast = new Date(scheduledDateStr) < new Date(new Date().toDateString());

    const newCare: PeriodicCareItem = {
      id: Date.now().toString(),
      customerName: values.customerName,
      careType: values.careType,
      scheduledDate: scheduledDateStr,
      assignee: values.assignee || 'Đặng Anh Hoan',
      status: 'PENDING',
      notes: values.notes,
      isOverdue: isPast,
    };

    setCares([newCare, ...cares]);
    setIsCreateOpen(false);
    createForm.resetFields();
    message.success(`Đã lên lịch chăm sóc cho khách hàng ${newCare.customerName}!`);
  };

  const handleMarkDone = (values: any) => {
    if (!selectedCare) return;

    setCares(
      cares.map((c) =>
        c.id === selectedCare.id
          ? {
              ...c,
              status: 'DONE',
              completedAt: new Date().toLocaleString('vi-VN'),
              notes: values.notes || c.notes,
              isOverdue: false,
            }
          : c
      )
    );

    setIsDoneOpen(false);
    doneForm.resetFields();
    message.success(`Đã ghi nhận hoàn tất lịch chăm sóc khách hàng ${selectedCare.customerName}!`);
  };

  const filteredCares = cares.filter((item) => {
    const matchSearch =
      item.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchText.toLowerCase()));

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchType = typeFilter === 'ALL' || item.careType === typeFilter;
    const matchWarning = !warningOnly || (item.status === 'PENDING' && item.isOverdue);

    return matchSearch && matchStatus && matchType && matchWarning;
  });

  const columns = [
    {
      title: 'Khách Hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 220,
      render: (name: string, record: PeriodicCareItem) => (
        <div>
          <strong style={{ color: '#0f172a' }}>{name}</strong>
          {record.isOverdue && record.status === 'PENDING' && (
            <Tag color="error" style={{ marginLeft: 8, fontSize: 11 }}>
              Quá hạn
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Loại Hình Chăm Sóc',
      dataIndex: 'careType',
      key: 'careType',
      width: 230,
      render: (type: CareType) => {
        const colorMap: Record<string, string> = {
          'Bảo trì hệ thống định kỳ': 'purple',
          'Thăm hỏi & Khảo sát hài lòng': 'blue',
          'Gia hạn hợp đồng / dịch vụ': 'cyan',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Ngày Dự Kiến',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 140,
      render: (date: string, record: PeriodicCareItem) => (
        <span style={{ fontWeight: 600, color: record.isOverdue && record.status === 'PENDING' ? '#ef4444' : '#334155' }}>
          <CalendarOutlined style={{ marginRight: 6 }} />
          {date}
        </span>
      ),
    },
    {
      title: 'Nhân Viên Phụ Trách',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 160,
      render: (assignee?: string) => assignee || <Text type="secondary">Chưa giao</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: CareStatus) => (
        <Tag
          icon={status === 'DONE' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={status === 'DONE' ? 'success' : 'warning'}
          style={{ padding: '2px 8px', fontWeight: 600 }}
        >
          {status === 'DONE' ? 'Đã hoàn thành' : 'Chưa thực hiện'}
        </Tag>
      ),
    },
    {
      title: 'Ghi Chú / Kết Quả',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string, record: PeriodicCareItem) => (
        <div>
          <div>{notes || <Text type="secondary">-</Text>}</div>
          {record.completedAt && (
            <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
              Hoàn thành lúc: {record.completedAt}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'action',
      width: 160,
      render: (_: any, record: PeriodicCareItem) => (
        <Space>
          {record.status === 'PENDING' ? (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ background: '#10b981', borderColor: '#10b981' }}
              onClick={() => {
                setSelectedCare(record);
                doneForm.setFieldsValue({ notes: record.notes || '' });
                setIsDoneOpen(true);
              }}
            >
              Hoàn thành
            </Button>
          ) : (
            <Tag color="default">Đã đóng</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScheduleOutlined style={{ color: '#8b5cf6' }} /> US-09: Lập Kế Hoạch & Nhắc Nhở Chăm Sóc Định Kỳ
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15 }}>
          Quản lý lịch chăm sóc khách hàng định kỳ (bảo trì hệ thống, khảo sát độ hài lòng, tái tục hợp đồng). Tự động cảnh báo các lịch hẹn quá hạn hoặc sắp diễn ra trong 7 ngày.
        </Paragraph>
      </div>

      {/* Reminder Banner */}
      {overdueCount > 0 && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <strong>CẢNH BÁO NHẮC VIỆC:</strong> Có <strong>{overdueCount}</strong> lịch chăm sóc định kỳ đã quá ngày dự kiến nhưng chưa hoàn thành!
              </span>
              <Button size="small" danger onClick={() => setWarningOnly(!warningOnly)}>
                {warningOnly ? 'Xem toàn bộ lịch' : 'Chỉ xem lịch quá hạn'}
              </Button>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: 10 }}
        />
      )}

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic title="Tổng Lịch Chăm Sóc" value={cares.length} prefix={<ScheduleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Lịch Hẹn Quá Hạn"
              value={overdueCount}
              valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Đang Chờ Thực Hiện"
              value={pendingCount}
              valueStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Statistic
              title="Đã Hoàn Thành"
              value={doneCount}
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
        title={
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <Space wrap>
              <Input
                placeholder="Tìm khách hàng hoặc ghi chú..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 260 }}
                allowClear
              />
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
                <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
                <Select.Option value="PENDING">Chưa thực hiện</Select.Option>
                <Select.Option value="DONE">Đã hoàn thành</Select.Option>
              </Select>
              <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 230 }}>
                <Select.Option value="ALL">Tất cả loại chăm sóc</Select.Option>
                <Select.Option value="Bảo trì hệ thống định kỳ">Bảo trì hệ thống định kỳ</Select.Option>
                <Select.Option value="Thăm hỏi & Khảo sát hài lòng">Thăm hỏi & Khảo sát hài lòng</Select.Option>
                <Select.Option value="Gia hạn hợp đồng / dịch vụ">Gia hạn hợp đồng / dịch vụ</Select.Option>
              </Select>
              <Button
                type={warningOnly ? 'primary' : 'default'}
                danger={warningOnly}
                icon={<FilterOutlined />}
                onClick={() => setWarningOnly(!warningOnly)}
              >
                {warningOnly ? 'Đang lọc quá hạn' : 'Lọc quá hạn'}
              </Button>
            </Space>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
              style={{ background: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: 8, height: 38 }}
            >
              Lên Lịch Chăm Sóc Mới
            </Button>
          </div>
        }
      >
        <Table
          dataSource={filteredCares}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} lịch hẹn` }}
          bordered
        />
      </Card>

      {/* Modal Lập Lịch */}
      <Modal
        title="Lập Kế Hoạch Chăm Sóc Định Kỳ (US-09)"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText="Tạo kế hoạch"
        cancelText="Hủy"
        width={560}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="customerName"
            label="Khách Hàng"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input placeholder="Tên khách hàng hoặc doanh nghiệp" />
          </Form.Item>

          <Form.Item
            name="careType"
            label="Loại Hình Chăm Sóc"
            rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
            initialValue="Bảo trì hệ thống định kỳ"
          >
            <Select>
              <Select.Option value="Bảo trì hệ thống định kỳ">Bảo trì hệ thống định kỳ</Select.Option>
              <Select.Option value="Thăm hỏi & Khảo sát hài lòng">Thăm hỏi & Khảo sát hài lòng</Select.Option>
              <Select.Option value="Gia hạn hợp đồng / dịch vụ">Gia hạn hợp đồng / dịch vụ</Select.Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduledDate"
                label="Ngày Dự Kiến Thực Hiện"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignee" label="Nhân Viên Phụ Trách">
                <Input placeholder="Nhập tên nhân viên phụ trách" defaultValue="Đặng Anh Hoan" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Ghi Chú Kế Hoạch">
            <Input.TextArea rows={3} placeholder="Nội dung cần chuẩn bị hoặc yêu cầu đặc thù của khách..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Hoàn Thành */}
      <Modal
        title={`Xác Nhận Hoàn Thành: ${selectedCare?.customerName}`}
        open={isDoneOpen}
        onCancel={() => setIsDoneOpen(false)}
        onOk={() => doneForm.submit()}
        okText="Xác nhận hoàn tất"
        cancelText="Hủy"
      >
        <Form form={doneForm} layout="vertical" onFinish={handleMarkDone}>
          <div style={{ marginBottom: 12, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div><strong>Loại hình:</strong> {selectedCare?.careType}</div>
            <div><strong>Ngày hẹn:</strong> {selectedCare?.scheduledDate}</div>
            <div><strong>Người phụ trách:</strong> {selectedCare?.assignee}</div>
          </div>
          <Form.Item name="notes" label="Ghi Chú Kết Quả Sau Khi Chăm Sóc">
            <Input.TextArea rows={4} placeholder="Ghi nhận phản hồi của khách hàng, các đề xuất tiếp theo..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PeriodicCarePage;
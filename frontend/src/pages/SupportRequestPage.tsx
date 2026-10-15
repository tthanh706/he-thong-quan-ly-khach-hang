import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Space } from 'antd';

export const SupportRequestPage: React.FC = () => {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-101',
      customer: 'Công ty ABC',
      subject: 'Lỗi không đăng nhập được phần mềm',
      priority: 'HIGH',
      status: 'OPEN',
      createdAt: '2026-03-28 09:30',
    },
    {
      id: 'REQ-102',
      customer: 'Nguyễn Văn A',
      subject: 'Hướng dẫn xuất báo cáo định kỳ',
      priority: 'LOW',
      status: 'IN_PROGRESS',
      createdAt: '2026-03-28 10:15',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = (values: any) => {
    const newReq = {
      ...values,
      id: `REQ-${100 + requests.length + 1}`,
      status: 'OPEN',
      createdAt: new Date().toLocaleString(),
    };
    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    { title: 'Mã YC', dataIndex: 'id', key: 'id' },
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
    { title: 'Tiêu đề / Nội dung yêu cầu', dataIndex: 'subject', key: 'subject' },
    {
      title: 'Mức độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'orange' : 'blue';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
          OPEN: { label: 'Mới tiếp nhận', color: 'volcano' },
          IN_PROGRESS: { label: 'Đang xử lý', color: 'processing' },
          CLOSED: { label: 'Đã hoàn thành', color: 'success' },
        };
        return <Tag color={map[status]?.color}>{map[status]?.label}</Tag>;
      },
    },
    { title: 'Thời gian tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">Phân công</Button>
          <Button type="link">Cập nhật</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>US-08: Giao diện Quản lý Yêu cầu hỗ trợ</h2>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setIsModalOpen(true)}>
        Tạo Yêu cầu hỗ trợ mới
      </Button>

      <Table dataSource={requests} columns={columns} rowKey="id" />

      <Modal
        title="Tạo Yêu cầu hỗ trợ mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="customer" label="Khách hàng" rules={[{ required: true, message: 'Nhập tên khách hàng' }]}>
            <Input placeholder="Tên khách hàng / Doanh nghiệp" />
          </Form.Item>
          <Form.Item name="subject" label="Nội dung cần hỗ trợ" rules={[{ required: true, message: 'Nhập nội dung' }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết vấn đề..." />
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="MEDIUM">
            <Select>
              <Select.Option value="LOW">Thấp (Low)</Select.Option>
              <Select.Option value="MEDIUM">Trung bình (Medium)</Select.Option>
              <Select.Option value="HIGH">Cao (High)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportRequestPage;
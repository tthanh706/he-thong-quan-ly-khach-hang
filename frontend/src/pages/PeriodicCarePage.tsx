import React, { useState } from 'react';
import { Table, Button, DatePicker, Tag, Space, Modal, Form, Input, Select } from 'antd';

export const PeriodicCarePage: React.FC = () => {
  const [schedules, setSchedules] = useState([
    {
      id: '1',
      customerName: 'Tập đoàn X',
      careType: 'Bảo trì hệ thống định kỳ',
      scheduledDate: '2026-04-05',
      assignee: 'Dương Anh Hoan',
      status: 'PENDING',
    },
    {
      id: '2',
      customerName: 'Công ty Y',
      careType: 'Thăm hỏi & Khảo sát hài lòng',
      scheduledDate: '2026-03-30',
      assignee: 'Nguyễn Văn A',
      status: 'DONE',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = (values: any) => {
    const newSchedule = {
      ...values,
      id: Date.now().toString(),
      scheduledDate: values.scheduledDate ? values.scheduledDate.format('YYYY-MM-DD') : '',
      status: 'PENDING',
    };
    setSchedules([...schedules, newSchedule]);
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    { title: 'Tên Khách hàng', dataIndex: 'customerName', key: 'customerName' },
    { title: 'Loại hình chăm sóc', dataIndex: 'careType', key: 'careType' },
    { title: 'Ngày dự kiến', dataIndex: 'scheduledDate', key: 'scheduledDate' },
    { title: 'Nhân viên phụ trách', dataIndex: 'assignee', key: 'assignee' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'DONE' ? 'green' : 'gold'}>
          {status === 'DONE' ? 'Đã hoàn thành' : 'Chưa thực hiện'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">Đánh dấu Hoàn thành</Button>
          <Button type="link">Sửa lịch</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>US-09: Kế hoạch & Lịch Chăm sóc định kỳ</h2>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setIsModalOpen(true)}>
        Lập Lịch chăm sóc mới
      </Button>

      <Table dataSource={schedules} columns={columns} rowKey="id" />

      <Modal
        title="Tạo lịch chăm sóc định kỳ"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="customerName" label="Khách hàng" rules={[{ required: true, message: 'Nhập tên KH' }]}>
            <Input placeholder="Tên khách hàng" />
          </Form.Item>
          <Form.Item name="careType" label="Loại hình chăm sóc" rules={[{ required: true, message: 'Chọn loại hình' }]}>
            <Select placeholder="Chọn loại hình">
              <Select.Option value="Bảo trì hệ thống định kỳ">Bảo trì hệ thống định kỳ</Select.Option>
              <Select.Option value="Thăm hỏi & Khảo sát hài lòng">Thăm hỏi & Khảo sát hài lòng</Select.Option>
              <Select.Option value="Gia hạn hợp đồng / dịch vụ">Gia hạn hợp đồng / dịch vụ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="scheduledDate" label="Ngày thực hiện" rules={[{ required: true, message: 'Chọn ngày' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assignee" label="Nhân viên phụ trách">
            <Input placeholder="Nhập tên nhân viên" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PeriodicCarePage;
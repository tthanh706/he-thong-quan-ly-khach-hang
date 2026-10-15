import React, { useState } from 'react';
import { Upload, Button, Table, Card, message, Space, Tag } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

export const ExcelImportPage: React.FC = () => {
  const [previewData, setPreviewData] = useState<any[]>([]);

  const uploadProps: UploadProps = {
    name: 'file',
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a218d',
    headers: { authorization: 'authorization-text' },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} tải lên thành công.`);
        setPreviewData([
          { key: '1', code: 'KH001', name: 'Nguyễn Văn A', phone: '0901234567', email: 'a@gmail.com', status: 'Hợp lệ' },
          { key: '2', code: 'KH002', name: 'Trần Thị B', phone: '0912345678', email: 'b@gmail.com', status: 'Hợp lệ' },
          { key: '3', code: 'KH003', name: 'Lê Văn C', phone: 'Sai SĐT', email: 'c@gmail.com', status: 'Lỗi dữ liệu' },
        ]);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
  };

  const columns = [
    { title: 'Mã KH', dataIndex: 'code', key: 'code' },
    { title: 'Tên Khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Trạng thái kiểm tra',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Hợp lệ' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
  ];

  return (
    <Card title="US-06: Giao diện Nhập dữ liệu từ Excel" style={{ marginBottom: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Button icon={<DownloadOutlined />}>Tải file mẫu (.xlsx)</Button>
        </Space>

        <Upload.Dragger {...uploadProps} accept=".xlsx, .xls">
          <p className="ant-upload-drag-icon">
            <FileExcelOutlined style={{ fontSize: 48, color: '#217346' }} />
          </p>
          <p className="ant-upload-text">Kéo thả file Excel vào đây hoặc bấm để chọn file</p>
          <p className="ant-upload-hint">Hỗ trợ định dạng .xlsx, .xls (Tối đa 10MB)</p>
        </Upload.Dragger>
      </Space>

      {previewData.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Xem trước dữ liệu import</h3>
          <Table dataSource={previewData} columns={columns} pagination={false} />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => message.success('Lưu thành công!')}>
            Xác nhận Lưu dữ liệu
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ExcelImportPage;
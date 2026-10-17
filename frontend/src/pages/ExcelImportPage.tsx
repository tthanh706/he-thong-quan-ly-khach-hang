import React, { useState } from 'react';
import { Card, Upload, Button, Table, Tag, Space, Alert, Typography, Row, Col, Statistic, message, Modal, Divider } from 'antd';
import {
  DownloadOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { ImportPreviewRow } from '../types/crm';

const { Text, Title, Paragraph } = Typography;

const sampleExcelRows: ImportPreviewRow[] = [
  {
    key: '1',
    row: 2,
    code: 'KH005',
    name: 'Công ty Cổ phần Thép Việt Ý',
    phone: '0934567890',
    email: 'info@thepviety.vn',
    tax_code: '0105678912',
    address: 'KCN Phố Nối A, Hưng Yên',
    status: 'Hợp lệ',
    errors: [],
  },
  {
    key: '2',
    row: 3,
    code: 'KH006',
    name: 'Dược Phẩm Minh Đức',
    phone: '0987654321',
    email: 'contact@minhducpharma.com',
    tax_code: '0309876543',
    address: 'Quận 10, TP. Hồ Chí Minh',
    status: 'Hợp lệ',
    errors: [],
  },
  {
    key: '3',
    row: 4,
    code: 'KH001', // Trùng mã
    name: 'Công ty ABC Sao Chép',
    phone: '0911223344',
    email: 'duplicate@abc.com',
    tax_code: '0102030405',
    address: 'Hà Nội',
    status: 'Lỗi dữ liệu',
    errors: ['Mã KH KH001 đã tồn tại trong hệ thống'],
  },
  {
    key: '4',
    row: 5,
    code: 'KH007',
    name: 'Nguyễn Thị Bích',
    phone: '0812345', // Sai SĐT
    email: 'bich.nguyen@email', // Sai Email
    tax_code: '',
    address: 'Đà Nẵng',
    status: 'Lỗi dữ liệu',
    errors: ['Sai định dạng SĐT (cần 10 chữ số)', 'Email không hợp lệ'],
  },
  {
    key: '5',
    row: 6,
    code: '', // Thiếu mã
    name: '', // Thiếu tên
    phone: '0909090909',
    email: 'empty@test.com',
    tax_code: '',
    address: 'Cần Thơ',
    status: 'Lỗi dữ liệu',
    errors: ['Mã KH bắt buộc', 'Tên khách hàng bắt buộc'],
  },
];

export const ExcelImportPage: React.FC = () => {
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [importedLogs, setImportedLogs] = useState<any[]>([
    {
      id: 1,
      fileName: 'Danh_sach_khach_hang_Q1_2026.xlsx',
      time: '2026-03-25 14:20:10',
      total: 120,
      success: 118,
      failed: 2,
      status: 'COMPLETED',
    },
  ]);

  const validCount = previewData.filter((r) => r.status === 'Hợp lệ').length;
  const errorCount = previewData.filter((r) => r.status === 'Lỗi dữ liệu').length;

  const handleDownloadTemplate = () => {
    // Generate CSV template for immediate download
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'Mã KH,Tên khách hàng,Số điện thoại,Email,Mã số thuế,Địa chỉ\n' +
      'KH010,Công ty TNHH Ánh Dương,0901234567,anhduong@gmail.com,0101234567,Hà Nội\n' +
      'KH011,Tập đoàn Công nghệ Sao Mai,0987654321,saomai@tech.vn,0301234567,TP. Hồ Chí Minh\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'mau_import_khach_hang_crm.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã tải xuống file mẫu thành công!');
  };

  const loadSampleData = () => {
    setFileName('File_Khao_Sat_KHDN_Mau.xlsx');
    setPreviewData(sampleExcelRows);
    message.success('Đã nạp dữ liệu kiểm thử mẫu gồm cả dòng hợp lệ và lỗi!');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      setFileName(file.name);
      // Giả lập đọc và parse file
      message.loading({ content: `Đang phân tích file ${file.name}...`, key: 'uploading' });
      setTimeout(() => {
        message.success({ content: `Đã đọc xong file: ${file.name}`, key: 'uploading' });
        setPreviewData(sampleExcelRows);
      }, 700);
      return false; // Prevent automatic HTTP post
    },
  };

  const handleConfirmImport = () => {
    if (validCount === 0) {
      message.warning('Không có dòng nào hợp lệ để lưu vào hệ thống!');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận nhập dữ liệu vào CRM',
      content: `Hệ thống sẽ lưu ${validCount} khách hàng hợp lệ vào cơ sở dữ liệu. Bạn có chắc chắn muốn tiếp tục?`,
      okText: 'Xác nhận lưu',
      cancelText: 'Hủy',
      onOk: () => {
        setIsConfirming(true);
        setTimeout(() => {
          setIsConfirming(false);
          const newLog = {
            id: Date.now(),
            fileName: fileName || 'Du_lieu_import.xlsx',
            time: new Date().toLocaleString('vi-VN'),
            total: previewData.length,
            success: validCount,
            failed: errorCount,
            status: 'COMPLETED',
          };
          setImportedLogs([newLog, ...importedLogs]);
          message.success(`Đã nhập thành công ${validCount} khách hàng vào hệ thống!`);
          setPreviewData([]);
          setFileName('');
        }, 800);
      },
    });
  };

  const columns = [
    {
      title: 'Dòng',
      dataIndex: 'row',
      key: 'row',
      width: 70,
      render: (r: number) => <Tag color="default">#{r}</Tag>,
    },
    {
      title: 'Mã KH',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (c: string) => (c ? <strong>{c}</strong> : <Tag color="error">Thiếu mã</Tag>),
    },
    {
      title: 'Tên Khách Hàng',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => n || <Tag color="error">Thiếu tên</Tag>,
    },
    {
      title: 'Số Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (p: string) => p || <Text type="secondary">-</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (e: string) => e || <Text type="secondary">-</Text>,
    },
    {
      title: 'Mã Số Thuế',
      dataIndex: 'tax_code',
      key: 'tax_code',
      width: 120,
      render: (t: string) => t || <Text type="secondary">-</Text>,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag
          icon={status === 'Hợp lệ' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={status === 'Hợp lệ' ? 'success' : 'error'}
          style={{ fontWeight: 600, padding: '2px 8px' }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Chi Tiết Kiểm Tra / Ghi Chú Lỗi',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: string[]) => {
        if (!errors || errors.length === 0) {
          return <Tag color="green">Sẵn sàng lưu</Tag>;
        }
        return (
          <Space direction="vertical" size={2}>
            {errors.map((err, i) => (
              <Text key={i} type="danger" style={{ fontSize: '13px' }}>
                • {err}
              </Text>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileExcelOutlined style={{ color: '#10b981' }} /> Nhập Danh Sách Khách Hàng Từ Excel
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 15 }}>
          Hỗ trợ đọc file Excel (.xlsx, .xls) hoặc CSV, tự động kiểm tra định dạng dữ liệu, phát hiện trùng lặp mã KH và lọc các dòng lỗi trước khi lưu vào CRM.
        </Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <InboxOutlined style={{ color: '#3b82f6' }} />
                <span>Khu Vực Tải Lên & Xem Trước File</span>
              </Space>
            }
            extra={
              <Space>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                  Tải file mẫu (.xlsx/.csv)
                </Button>
                <Button type="dashed" icon={<ReloadOutlined />} onClick={loadSampleData}>
                  Nạp dữ liệu mẫu thử nghiệm
                </Button>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <Upload.Dragger {...uploadProps} accept=".xlsx, .xls, .csv">
              <p className="ant-upload-drag-icon">
                <FileExcelOutlined style={{ fontSize: 52, color: '#10b981' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 600 }}>
                Kéo thả file Excel vào đây hoặc bấm để duyệt file
              </p>
              <p className="ant-upload-hint" style={{ color: '#64748b' }}>
                Hỗ trợ định dạng .xlsx, .xls, .csv (Dung lượng tối đa 10MB). Hệ thống sẽ tự động xác thực từng dòng dữ liệu.
              </p>
            </Upload.Dragger>

            {fileName && (
              <Alert
                message={
                  <Space>
                    <InfoCircleOutlined />
                    <span>
                      Đang phân tích file: <strong>{fileName}</strong>
                    </span>
                  </Space>
                }
                type="info"
                showIcon={false}
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#8b5cf6' }} />
                <span>Thống Kê Kiểm Tra Dữ Liệu</span>
              </Space>
            }
            style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Tổng Số Dòng" value={previewData.length} prefix={<InboxOutlined />} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Dòng Hợp Lệ"
                  value={validCount}
                  valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Dòng Bị Lỗi"
                  value={errorCount}
                  valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tỷ Lệ Đạt"
                  value={previewData.length ? Math.round((validCount / previewData.length) * 100) : 0}
                  suffix="%"
                />
              </Col>
            </Row>

            <Divider style={{ margin: '18px 0' }} />

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#475569' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Quy tắc kiểm tra:</div>
              <div>• <strong>Mã KH & Tên KH:</strong> Bắt buộc, không được để trống.</div>
              <div>• <strong>Mã KH:</strong> Duy nhất, không trùng với khách hàng đã có.</div>
              <div>• <strong>SĐT:</strong> Định dạng di động Việt Nam (10 chữ số).</div>
              <div>• <strong>Email:</strong> Đúng chuẩn cấu trúc RFC email.</div>
            </div>

            {previewData.length > 0 && (
              <Button
                type="primary"
                size="large"
                block
                disabled={validCount === 0}
                loading={isConfirming}
                onClick={handleConfirmImport}
                style={{
                  marginTop: 20,
                  height: 48,
                  fontSize: 16,
                  borderRadius: 8,
                  background: validCount > 0 ? '#10b981' : undefined,
                  borderColor: validCount > 0 ? '#10b981' : undefined,
                }}
              >
                Xác Nhận Lưu {validCount} Dòng Hợp Lệ
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      {previewData.length > 0 && (
        <Card
          title={
            <Space>
              <span>Kết Quả Phân Tích & Xem Trước Dữ Liệu ({previewData.length} dòng)</span>
              <Tag color="blue">{fileName}</Tag>
            </Space>
          }
          style={{ marginTop: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <Table
            dataSource={previewData}
            columns={columns}
            pagination={false}
            rowClassName={(record) => (record.status === 'Lỗi dữ liệu' ? 'bg-red-50' : '')}
            bordered
          />
        </Card>
      )}

      <Card
        title="Lịch Sử Các Lần Nhập Excel Gần Đây (Import Logs)"
        style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
      >
        <Table
          dataSource={importedLogs}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Tên File', dataIndex: 'fileName', key: 'fileName', render: (t) => <strong>{t}</strong> },
            { title: 'Thời Gian Thực Hiện', dataIndex: 'time', key: 'time' },
            { title: 'Tổng Số Dòng', dataIndex: 'total', key: 'total' },
            {
              title: 'Thành Công',
              dataIndex: 'success',
              key: 'success',
              render: (v) => <Tag color="green">{v} khách hàng</Tag>,
            },
            {
              title: 'Lỗi Bỏ Qua',
              dataIndex: 'failed',
              key: 'failed',
              render: (v) => (v > 0 ? <Tag color="red">{v} dòng</Tag> : <Tag color="default">0</Tag>),
            },
            {
              title: 'Trạng Thái',
              dataIndex: 'status',
              key: 'status',
              render: () => <Tag color="blue">HOÀN TẤT</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ExcelImportPage;
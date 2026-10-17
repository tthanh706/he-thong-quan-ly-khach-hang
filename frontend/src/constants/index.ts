import { Contact, Company } from '../types';

export const MOCK_COMPANIES: Company[] = [
  { id: 'comp-1', name: 'Tập đoàn Công nghệ FPT', code: 'FPT' },
  { id: 'comp-2', name: 'Tập đoàn Vingroup', code: 'VIC' }
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    name: 'Nguyễn Văn A',
    title: 'Giám đốc Công nghệ',
    email: 'anv@fpt.com.vn',
    phone: '0901234567',
    companyId: 'comp-1',
    companyName: 'Tập đoàn Công nghệ FPT',
    department: 'Ban IT',
    isPrimary: true,
    notes: 'Quyết định IT',
  },
  {
    id: 'cnt-2',
    name: 'Trần Thị Mai',
    title: 'Trưởng phòng Mua sắm',
    email: 'maitt@fpt.com.vn',
    phone: '0912345678',
    companyId: 'comp-1',
    companyName: 'Tập đoàn Công nghệ FPT',
    department: 'Ban Mua sắm',
    isPrimary: false,
    notes: 'Phụ trách ký kết hợp đồng',
  },
  {
    id: 'cnt-3',
    name: 'Phạm Hoàng Long',
    title: 'Phó Tổng Giám Đốc',
    email: 'longph@vingroup.net',
    phone: '0988776655',
    companyId: 'comp-2',
    companyName: 'Tập đoàn Vingroup',
    department: 'Ban Giám đốc',
    isPrimary: true,
    notes: 'Người phê duyệt dự án',
  },
];

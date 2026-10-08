import React, { useState } from 'react';

// Định nghĩa kiểu dữ liệu trực tiếp trong file để tránh lỗi import
interface CustomFieldItem {
  id: number;
  module: 'Customer' | 'Opportunity';
  fieldName: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Select';
  isRequired: boolean;
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomFieldItem[]>([
    { id: 1, module: 'Customer', fieldName: 'Lĩnh vực hoạt động', fieldType: 'Select', isRequired: true },
    { id: 2, module: 'Opportunity', fieldName: 'Ngân sách dự kiến', fieldType: 'Number', isRequired: false },
  ]);

  const [fieldName, setFieldName] = useState('');
  const [module, setModule] = useState<'Customer' | 'Opportunity'>('Customer');
  const [fieldType, setFieldType] = useState<'Text' | 'Number' | 'Date' | 'Select'>('Text');
  const [isRequired, setIsRequired] = useState(false);

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;
    setFields([...fields, { id: Date.now(), module, fieldName, fieldType, isRequired }]);
    setFieldName('');
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
          S2-08: Khai Báo Trường Tùy Chỉnh (Custom Fields)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0' }}>
          Cấu hình thêm các trường dữ liệu động cho Khách hàng & Cơ hội.
        </p>
      </div>

      <form onSubmit={handleAddField} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Tên trường (VD: Số năm kinh nghiệm)" 
          value={fieldName} 
          onChange={e => setFieldName(e.target.value)} 
          required 
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: '1', minWidth: '200px' }} 
        />
        <select value={module} onChange={e => setModule(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="Customer">Customer</option>
          <option value="Opportunity">Opportunity</option>
        </select>
        <select value={fieldType} onChange={e => setFieldType(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
          <option value="Text">Text</option>
          <option value="Number">Number</option>
          <option value="Date">Date</option>
          <option value="Select">Select</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
          <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} /> Bắt buộc
        </label>
        <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>+ Thêm Trường</button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '12px' }}>Tên Trường</th>
            <th style={{ padding: '12px' }}>Áp dụng Module</th>
            <th style={{ padding: '12px' }}>Kiểu Dữ Liệu</th>
            <th style={{ padding: '12px' }}>Bắt Buộc</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(f => (
            <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px', fontWeight: '600' }}>{f.fieldName}</td>
              <td style={{ padding: '12px'}}><span style={{ padding: '2px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{f.module}</span></td>
              <td style={{ padding: '12px' }}>{f.fieldType}</td>
              <td style={{ padding: '12px' }}>{f.isRequired ? 'Có' : 'Không'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
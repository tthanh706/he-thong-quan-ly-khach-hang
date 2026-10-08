import React, { useState } from 'react';

interface CustomField {
  id: number;
  fieldName: string;
  module: string;
  dataType: string;
  isRequired: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('custom-fields');

  // State quản lý danh sách trường tùy chỉnh
  const [fields, setFields] = useState<CustomField[]>([
    { id: 1, fieldName: 'Lĩnh vực hoạt động', module: 'Customer', dataType: 'Select', isRequired: true },
    { id: 2, fieldName: 'Ngân sách dự kiến', module: 'Opportunity', dataType: 'Number', isRequired: false },
  ]);

  // State cho form thêm mới
  const [fieldName, setFieldName] = useState('');
  const [module, setModule] = useState('Customer');
  const [dataType, setDataType] = useState('Text');
  const [isRequired, setIsRequired] = useState(false);

  // Hàm thêm trường mới
  const handleAddField = () => {
    if (!fieldName.trim()) return;
    const newField: CustomField = {
      id: Date.now(),
      fieldName,
      module,
      dataType,
      isRequired,
    };
    setFields([...fields, newField]);
    setFieldName('');
    setIsRequired(false);
  };

  // Hàm xóa trường theo id
  const handleDeleteField = (id: number) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const tabs = ['custom-fields'];

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '30px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: '20px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>Hệ Thống CRM (Sprint 2)</h1>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab ? '#0284c7' : '#e2e8f0',
                  color: activeTab === tab ? '#fff' : '#475569',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'custom-fields' ? 'Custom Fields' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '30px' }}>
          {activeTab === 'custom-fields' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '20px', color: '#0f172a', margin: '0 0 5px 0' }}>Khai Báo Trường Tùy Chỉnh (Custom Fields)</h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Cấu hình thêm các trường dữ liệu động cho Khách hàng & Cơ hội.</p>
              </div>

              {/* Form thêm mới */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '25px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Tên trường (VD: Số năm kinh nghiệm)"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  style={{ flex: '2 1 200px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />

                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="Customer">Customer</option>
                  <option value="Opportunity">Opportunity</option>
                </select>

                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  style={{ flex: '1 1 120px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Select">Select</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Bắt buộc
                </label>

                <button
                  onClick={handleAddField}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                >
                  + Thêm Trường
                </button>
              </div>

              {/* Bảng hiển thị dữ liệu */}
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>Tên Trường</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>Áp dụng Module</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>Kiểu Dữ Liệu</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>Bắt Buộc</th>
                    <th style={{ padding: '12px 16px', color: '#475569', fontSize: '13px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{field.fieldName}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {field.module}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{field.dataType}</td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{field.isRequired ? 'Có' : 'Không'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                        Chưa có trường tùy chỉnh nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
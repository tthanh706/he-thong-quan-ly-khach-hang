import React, { useState } from 'react';
import type { Product } from '../../types/product';
import { Search, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách sản phẩm...</div>;
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Search Bar */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 38px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              outline: 'none',
              color: '#0f172a',
              backgroundColor: '#fff'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mã Sản Phẩm</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tên Sản Phẩm / Dịch Vụ</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Loại</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đơn Vị</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Giá Niêm Yết</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Không tìm thấy dữ liệu phù hợp
                </td>
              </tr>
            ) : (
              filteredProducts.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ backgroundColor: '#f1f5f9', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}>
                      {item.code}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>
                    {item.type === 'PRODUCT' ? 'Sản phẩm' : 'Dịch vụ'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#475569' }}>{item.unit || 'Cái'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.listPrice)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => onToggleStatus(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2',
                        color: item.isActive ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {item.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {item.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => onEdit(item)}
                        style={{ border: 'none', backgroundColor: '#eff6ff', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#2563eb' }}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        style={{ border: 'none', backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
        Hiển thị <strong>{filteredProducts.length}</strong> / <strong>{products.length}</strong> sản phẩm
      </div>
    </div>
  );
};
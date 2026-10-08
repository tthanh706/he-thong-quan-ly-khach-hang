import React, { useEffect, useState } from 'react';
import type { Category, CategoryType, CreateCategoryPayload } from '../../types/category';
import { X } from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  editingCategory?: Category | null;
  onClose: () => void;
  onSubmit: (payload: CreateCategoryPayload) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  editingCategory,
  onClose,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('LEAD_SOURCE');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setCode(editingCategory.code);
      setName(editingCategory.name);
      setType(editingCategory.type);
      setSortOrder(editingCategory.sortOrder || 1);
    } else {
      setCode('');
      setName('');
      setType('LEAD_SOURCE');
      setSortOrder(1);
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên danh mục');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        type,
        sortOrder: Number(sortOrder) || 1,
        isActive: editingCategory ? editingCategory.isActive : true,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
            {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Mã danh mục *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Tên danh mục *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Phân loại hệ thống *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
            >
              <option value="LEAD_SOURCE">Nguồn Lead</option>
              <option value="INDUSTRY">Ngành nghề kinh doanh</option>
              <option value="BUSINESS_TYPE">Loại hình doanh nghiệp</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Thứ tự hiển thị</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              min={1}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
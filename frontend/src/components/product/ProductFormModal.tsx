import React, { useEffect, useState } from 'react';
import type { Product, CreateProductPayload } from '../../types/product';
import { X } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct?: Product | null;
  onClose: () => void;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  editingProduct,
  onClose,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [unit, setUnit] = useState('Cái');
  const [listPrice, setListPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setCode(editingProduct.code);
      setName(editingProduct.name);
      setType(editingProduct.type as 'PRODUCT' | 'SERVICE');
      setUnit(editingProduct.unit || 'Cái');
      setListPrice(editingProduct.listPrice || 0);
      setDescription(editingProduct.description || '');
    } else {
      setCode('');
      setName('');
      setType('PRODUCT');
      setUnit('Cái');
      setListPrice(0);
      setDescription('');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert('Vui lòng điền đầy đủ Mã và Tên sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        type,
        unit,
        listPrice: Number(listPrice) || 0,
        description,
        isActive: editingProduct ? editingProduct.isActive : true,
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
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
            {editingProduct ? 'Chỉnh sửa sản phẩm / dịch vụ' : 'Thêm sản phẩm / dịch vụ mới'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Mã sản phẩm *</label>
              <input
                type="text"
                placeholder="VD: SVC-001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Loại *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'PRODUCT' | 'SERVICE')}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}
              >
                <option value="PRODUCT">Sản phẩm</option>
                <option value="SERVICE">Dịch vụ</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Tên sản phẩm / dịch vụ *</label>
            <input
              type="text"
              placeholder="VD: Phần mềm CRM Standard..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Đơn vị tính</label>
              <input
                type="text"
                placeholder="VD: Gói, Cái, Buổi..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Giá niêm yết (VNĐ)</label>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                min={0}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Mô tả</label>
            <textarea
              rows={3}
              placeholder="Nhập mô tả chi tiết sản phẩm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical' }}
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
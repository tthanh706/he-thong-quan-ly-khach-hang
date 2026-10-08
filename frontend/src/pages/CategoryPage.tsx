import React, { useEffect, useState } from 'react';
import type { Category, CategoryType, CreateCategoryPayload } from '../types/category';
import { categoryApi } from '../services/api/categoryApi';
import { CategoryList } from '../components/category/CategoryList';
import { CategoryFormModal } from '../components/category/CategoryFormModal';
import { Plus } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<CategoryType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (payload: CreateCategoryPayload) => {
    if (editingCategory) {
      await categoryApi.updateCategory(editingCategory.id, payload);
    } else {
      await categoryApi.createCategory(payload);
    }
    fetchCategories();
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      await categoryApi.deleteCategory(id);
      fetchCategories();
    }
  };

  const handleToggleStatus = (category: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const filteredCategories = selectedType === 'ALL'
    ? categories
    : categories.filter((c) => c.type === selectedType);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
            Khai báo Danh mục dùng chung
          </h2>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Quản lý các loại danh mục hệ thống: Nguồn Lead, Ngành nghề kinh doanh, Loại hình doanh nghiệp.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'LEAD_SOURCE', label: 'Nguồn Lead' },
          { key: 'INDUSTRY', label: 'Ngành nghề' },
          { key: 'BUSINESS_TYPE', label: 'Loại hình doanh nghiệp' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              border: selectedType === tab.key ? '1px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: selectedType === tab.key ? '#2563eb' : '#fff',
              color: selectedType === tab.key ? '#fff' : '#475569',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CategoryList
        categories={filteredCategories}
        isLoading={loading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      <CategoryFormModal
        isOpen={isModalOpen}
        editingCategory={editingCategory}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSave}
      />
    </div>
  );
};
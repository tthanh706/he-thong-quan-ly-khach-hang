import React, { useEffect, useState } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CommonCategory,
  type CategoryType,
} from '../services/categoryService';
import toast from 'react-hot-toast';

const CATEGORY_TABS: { key: CategoryType; label: string; icon: string }[] = [
  { key: 'LEAD_SOURCE', label: 'Nguồn khách hàng', icon: '🎯' },
  { key: 'INDUSTRY', label: 'Ngành nghề kinh doanh', icon: '🏢' },
  { key: 'BUSINESS_TYPE', label: 'Loại hình doanh nghiệp', icon: '📑' },
];

export default function CategoriesPage() {
  const [selectedType, setSelectedType] = useState<CategoryType>('LEAD_SOURCE');
  const [categories, setCategories] = useState<CommonCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CommonCategory | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategories(selectedType);
      setCategories(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [selectedType]);

  const handleOpenModal = (item?: CommonCategory) => {
    if (item) {
      setEditingItem(item);
      setForm({
        code: item.code,
        name: item.name,
        description: item.description || '',
        sort_order: item.sort_order,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setForm({
        code: '',
        name: '',
        description: '',
        sort_order: categories.length + 1,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateCategory(editingItem.id, {
          name: form.name,
          description: form.description,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        });
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await createCategory({
          category_type: selectedType,
          code: form.code.trim().toUpperCase(),
          name: form.name,
          description: form.description,
          sort_order: Number(form.sort_order),
          is_active: form.is_active,
        });
        toast.success('Thêm danh mục mới thành công!');
      }
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await deleteCategory(id);
      toast.success('Đã xóa danh mục');
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Quản lý Danh mục dùng chung
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Cấu hình dữ liệu danh mục phân loại chuẩn hóa hệ thống (Nguồn khách hàng, Ngành nghề, Loại hình doanh nghiệp).
          </p>
        </div>
        <button className="primary" onClick={() => handleOpenModal()}>
          + Thêm danh mục mới
        </button>
      </div>

      <div className="tabs" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={selectedType === tab.key ? 'selected' : ''}
            onClick={() => setSelectedType(tab.key)}
            style={{ cursor: 'pointer', fontWeight: 600 }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu...</div>
        ) : categories.length === 0 ? (
          <div className="empty">Chưa có danh mục nào trong nhóm này. Hãy bấm "+ Thêm danh mục mới".</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã danh mục</th>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#7545d9' }}>{c.code}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{c.description || '---'}</td>
                    <td>{c.sort_order}</td>
                    <td>
                      <span className={`status ${c.is_active ? 'active' : 'locked'}`}>
                        {c.is_active ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        style={{ border: 'none', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', marginRight: '6px' }}
                        onClick={() => handleOpenModal(c)}
                      >
                        Sửa
                      </button>
                      <button
                        style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingItem ? 'Sửa danh mục' : 'Thêm mới danh mục'}</h3>
              <button className="icon-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
              <label>
                Mã định danh (Code):
                <input
                  type="text"
                  required
                  disabled={!!editingItem}
                  placeholder="Ví dụ: SRC_FACEBOOK, IND_TECH..."
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>
              <label>
                Tên hiển thị:
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quảng cáo Facebook"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Mô tả chi tiết:
                <input
                  type="text"
                  placeholder="Mô tả bổ sung nếu có..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Thứ tự sắp xếp:
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '28px' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <span>Đang hoạt động</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

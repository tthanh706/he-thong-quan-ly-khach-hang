import React, { useEffect, useState } from 'react';
import type { Product, CreateProductPayload } from '../types/product';
import { productApi } from '../services/api/productApi';
import { ProductList } from '../components/product/ProductList';
import { ProductFormModal } from '../components/product/ProductFormModal';
import { Plus } from 'lucide-react';

export const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (payload: CreateProductPayload) => {
    if (editingProduct) {
      await productApi.updateProduct(editingProduct.id, payload);
    } else {
      await productApi.createProduct(payload);
    }
    fetchProducts();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      await productApi.deleteProduct(id);
      fetchProducts();
    }
  };

  const handleToggleStatus = (product: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
            Quản lý Sản phẩm / Dịch vụ & Bảng giá
          </h2>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Thiết lập danh mục dịch vụ, giá niêm yết chuẩn trước khi quản lý bán hàng.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
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
          <Plus size={18} /> Thêm sản phẩm / dịch vụ
        </button>
      </div>

      <ProductList
        products={products}
        isLoading={loading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />

      <ProductFormModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSave}
      />
    </div>
  );
};
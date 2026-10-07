import React, { useEffect, useState } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getPriceLists,
  createPriceList,
  getPriceListDetail,
  upsertPriceListItem,
  deletePriceListItem,
  type Product,
  type PriceList,
} from '../services/productService';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'price-lists'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Modal Product
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    unit: 'Cái',
    list_price: 100000,
    currency: 'VND',
    description: '',
    is_active: true,
  });

  // Modal Price List
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [priceListForm, setPriceListForm] = useState({
    code: '',
    name: '',
    currency: 'VND',
    is_standard: false,
    is_active: true,
  });

  // Selected Price List Detail Modal
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    product_id: 0,
    unit_price: 0,
    min_quantity: 1,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.q = search;
      if (filterType) params.type = filterType;
      const res = await getProducts(params);
      setProducts(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadPriceLists = async () => {
    try {
      setLoading(true);
      const res = await getPriceLists();
      setPriceLists(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải danh sách bảng giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    } else {
      loadPriceLists();
    }
  }, [activeTab, filterType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        sku: product.sku,
        name: product.name,
        type: product.type,
        unit: product.unit || '',
        list_price: Number(product.list_price),
        currency: product.currency || 'VND',
        description: product.description || '',
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        sku: `PRD-${Date.now().toString().slice(-4)}`,
        name: '',
        type: 'PRODUCT',
        unit: 'Cái',
        list_price: 50000,
        currency: 'VND',
        description: '',
        is_active: true,
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await createProduct(productForm);
        toast.success('Thêm mới sản phẩm thành công!');
      }
      setShowProductModal(false);
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await deleteProduct(id);
      toast.success('Đã xóa sản phẩm');
      loadProducts();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa');
    }
  };

  const handleSavePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPriceList(priceListForm);
      toast.success('Đã tạo bảng giá mới!');
      setShowPriceListModal(false);
      loadPriceLists();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo bảng giá');
    }
  };

  const handleViewPriceListDetail = async (list: PriceList) => {
    try {
      const res = await getPriceListDetail(list.id);
      setSelectedPriceList(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Không thể xem chi tiết bảng giá');
    }
  };

  const handleAddItemToPriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceList) return;
    try {
      await upsertPriceListItem(selectedPriceList.id, {
        product_id: Number(itemForm.product_id),
        unit_price: Number(itemForm.unit_price),
        min_quantity: Number(itemForm.min_quantity),
      });
      toast.success('Đã gán giá sản phẩm vào bảng giá!');
      setShowItemModal(false);
      handleViewPriceListDetail(selectedPriceList);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gán giá');
    }
  };

  const handleDeleteItemFromPriceList = async (itemId: number) => {
    if (!selectedPriceList || !window.confirm('Xóa sản phẩm này khỏi bảng giá?')) return;
    try {
      await deletePriceListItem(selectedPriceList.id, itemId);
      toast.success('Đã xóa khỏi bảng giá');
      handleViewPriceListDetail(selectedPriceList);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Quản lý Sản phẩm & Bảng giá
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Quản lý danh mục hàng hóa, dịch vụ và bảng giá chính sách bán hàng đa kênh.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'products' ? (
            <button className="primary" onClick={() => handleOpenProductModal()}>
              + Thêm sản phẩm / dịch vụ
            </button>
          ) : (
            <button className="primary" onClick={() => setShowPriceListModal(true)}>
              + Tạo bảng giá mới
            </button>
          )}
        </div>
      </div>

      <div className="tabs" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          className={activeTab === 'products' ? 'selected' : ''}
          onClick={() => setActiveTab('products')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          📦 Danh mục Sản phẩm & Dịch vụ
        </button>
        <button
          className={activeTab === 'price-lists' ? 'selected' : ''}
          onClick={() => setActiveTab('price-lists')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          💲 Quản lý Bảng giá
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="card" style={{ padding: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ maxWidth: '180px' }}
            >
              <option value="">-- Tất cả loại --</option>
              <option value="PRODUCT">Sản phẩm vật lý</option>
              <option value="SERVICE">Dịch vụ</option>
            </select>
            <button type="submit" className="primary">Tìm kiếm</button>
            <button type="button" className="muted" onClick={() => { setSearch(''); setFilterType(''); loadProducts(); }}>
              Làm mới
            </button>
          </form>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu...</div>
          ) : products.length === 0 ? (
            <div className="empty">Chưa có sản phẩm nào. Hãy tạo sản phẩm đầu tiên!</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã SKU</th>
                    <th>Tên sản phẩm / dịch vụ</th>
                    <th>Phân loại</th>
                    <th>Đơn vị</th>
                    <th>Giá niêm yết</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{p.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: '12px', color: '#64748b' }}>{p.description}</div>}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: p.type === 'SERVICE' ? '#e0f2fe' : '#fef3c7',
                          color: p.type === 'SERVICE' ? '#0369a1' : '#b45309'
                        }}>
                          {p.type === 'SERVICE' ? 'Dịch vụ' : 'Sản phẩm'}
                        </span>
                      </td>
                      <td>{p.unit || '---'}</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        {Number(p.list_price).toLocaleString()} {p.currency}
                      </td>
                      <td>
                        <span className={`status ${p.is_active ? 'active' : 'locked'}`}>
                          {p.is_active ? 'Kinh doanh' : 'Ngừng'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          style={{ border: 'none', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', marginRight: '6px' }}
                          onClick={() => handleOpenProductModal(p)}
                        >
                          Sửa
                        </button>
                        <button
                          style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                          onClick={() => handleDeleteProduct(p.id)}
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
      )}

      {activeTab === 'price-lists' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPriceList ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Danh sách Bảng giá</h3>
            {priceLists.length === 0 ? (
              <div className="empty">Chưa có bảng giá nào. Nhấn "+ Tạo bảng giá mới" để bắt đầu.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên bảng giá</th>
                      <th>Tiền tệ</th>
                      <th>Mặc định</th>
                      <th>Số SP</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceLists.map((pl) => (
                      <tr key={pl.id} style={{ background: selectedPriceList?.id === pl.id ? '#f5f3ff' : 'transparent' }}>
                        <td style={{ fontWeight: 700 }}>{pl.code}</td>
                        <td>{pl.name}</td>
                        <td>{pl.currency}</td>
                        <td>
                          {pl.is_standard ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                              Tiêu chuẩn
                            </span>
                          ) : '---'}
                        </td>
                        <td>{pl.items_count ?? 0}</td>
                        <td>
                          <button
                            style={{ border: 'none', background: '#6366f1', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '12px' }}
                            onClick={() => handleViewPriceListDetail(pl)}
                          >
                            Xem mục giá
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedPriceList && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>Chi tiết: {selectedPriceList.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Mã: {selectedPriceList.code} ({selectedPriceList.currency})</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="primary"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => {
                      if (products.length === 0) loadProducts();
                      setItemForm({ product_id: products[0]?.id || 0, unit_price: 100000, min_quantity: 1 });
                      setShowItemModal(true);
                    }}
                  >
                    + Thêm mục giá
                  </button>
                  <button
                    style={{ border: 'none', background: '#e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => setSelectedPriceList(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {(!selectedPriceList.items || selectedPriceList.items.length === 0) ? (
                <div className="empty">Bảng giá này chưa có sản phẩm nào được thiết lập.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>SL tối thiểu</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPriceList.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.product?.sku}</strong> - {item.product?.name}
                          </td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>
                            {Number(item.unit_price).toLocaleString()} {selectedPriceList.currency}
                          </td>
                          <td>{item.min_quantity}</td>
                          <td>
                            <button
                              style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
                              onClick={() => handleDeleteItemFromPriceList(item.id)}
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
          )}
        </div>
      )}

      {/* Modal Add/Edit Product */}
      {showProductModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Cập nhật Sản phẩm' : 'Thêm mới Sản phẩm / Dịch vụ'}</h3>
              <button className="icon-button" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveProduct} style={{ marginTop: '16px' }}>
              <label>
                Mã SKU:
                <input
                  type="text"
                  required
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </label>
              <label>
                Tên sản phẩm / dịch vụ:
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Phân loại:
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                  >
                    <option value="PRODUCT">Sản phẩm vật lý</option>
                    <option value="SERVICE">Dịch vụ</option>
                  </select>
                </label>
                <label>
                  Đơn vị tính:
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <label>
                  Giá niêm yết:
                  <input
                    type="number"
                    required
                    value={productForm.list_price}
                    onChange={(e) => setProductForm({ ...productForm, list_price: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Tiền tệ:
                  <input
                    type="text"
                    value={productForm.currency}
                    onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Mô tả:
                <input
                  type="text"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProductModal(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Price List */}
      {showPriceListModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Tạo Bảng giá mới</h3>
              <button className="icon-button" onClick={() => setShowPriceListModal(false)}>×</button>
            </div>
            <form onSubmit={handleSavePriceList} style={{ marginTop: '16px' }}>
              <label>
                Mã bảng giá:
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: BG-VIP-2026"
                  value={priceListForm.code}
                  onChange={(e) => setPriceListForm({ ...priceListForm, code: e.target.value })}
                />
              </label>
              <label>
                Tên bảng giá:
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bảng giá đại lý VIP"
                  value={priceListForm.name}
                  onChange={(e) => setPriceListForm({ ...priceListForm, name: e.target.value })}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Tiền tệ:
                  <input
                    type="text"
                    value={priceListForm.currency}
                    onChange={(e) => setPriceListForm({ ...priceListForm, currency: e.target.value })}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '28px' }}>
                  <input
                    type="checkbox"
                    checked={priceListForm.is_standard}
                    onChange={(e) => setPriceListForm({ ...priceListForm, is_standard: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <span>Bảng giá tiêu chuẩn</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPriceListModal(false)}>Hủy</button>
                <button type="submit" className="primary">Tạo bảng giá</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Item to Price List */}
      {showItemModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Gán sản phẩm vào bảng giá</h3>
              <button className="icon-button" onClick={() => setShowItemModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddItemToPriceList} style={{ marginTop: '16px' }}>
              <label>
                Chọn sản phẩm:
                <select
                  required
                  value={itemForm.product_id}
                  onChange={(e) => setItemForm({ ...itemForm, product_id: Number(e.target.value) })}
                >
                  <option value={0}>-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} (Niêm yết: {Number(p.list_price).toLocaleString()} {p.currency})
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <label>
                  Đơn giá trong bảng giá này:
                  <input
                    type="number"
                    required
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: Number(e.target.value) })}
                  />
                </label>
                <label>
                  SL tối thiểu:
                  <input
                    type="number"
                    value={itemForm.min_quantity}
                    onChange={(e) => setItemForm({ ...itemForm, min_quantity: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowItemModal(false)}>Hủy</button>
                <button type="submit" className="primary">Gán giá</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

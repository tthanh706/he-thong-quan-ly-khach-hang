import React, { useEffect, useState } from 'react';
import { salesOpportunityService } from '../../services/salesOpportunityService';
import { getProducts } from '../../services/productService';
import type { SalesOpportunity, OpportunityProductItem, OpportunityCollaboratorItem, OpportunityAttachmentItem, OpportunityHistoryItem } from '../../types/salesOpportunity';
import { Package, Award, Users, Paperclip, History, Plus, Trash2, CheckCircle, XCircle, RotateCcw, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  opportunity: SalesOpportunity | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  currentUser?: any;
}

export const OpportunityDetailModal: React.FC<Props> = ({ opportunity, open, onClose, onUpdated, currentUser }) => {
  if (!open || !opportunity) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'close' | 'collaborators' | 'attachments' | 'history'>('overview');

  // Products state (S5-03)
  const [products, setProducts] = useState<OpportunityProductItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_percentage: 0,
    is_subscription: false,
    subscription_billing_cycle: 'monthly',
    subscription_duration_months: 12,
  });

  // Close deal state (S5-05)
  const [wonValue, setWonValue] = useState<number>(Number(opportunity.value || opportunity.amount || 0));
  const [signedDate, setSignedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [lossReason, setLossReason] = useState<string>('Giá đối thủ cạnh tranh tốt hơn');
  const [competitorName, setCompetitorName] = useState<string>('');
  const [reopenReason, setReopenReason] = useState<string>('');

  // Collaborators state (S6-03)
  const [collaborators, setCollaborators] = useState<OpportunityCollaboratorItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newCollaboratorUserId, setNewCollaboratorUserId] = useState<number | ''>('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<string>('Kỹ sư giải pháp (Presales)');

  // Attachments state (S6-04)
  const [attachments, setAttachments] = useState<OpportunityAttachmentItem[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Histories state (S6-01)
  const [histories, setHistories] = useState<OpportunityHistoryItem[]>([]);

  const isLeader = currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.role === 'TEAM_LEADER' || currentUser?.role === 'SALES_DIRECTOR';

  useEffect(() => {
    void loadProducts();
    void loadCollaborators();
    void loadAttachments();
    void loadHistories();
    void loadCatalog();
  }, [opportunity.id]);

  const loadProducts = async () => {
    try {
      const data = await salesOpportunityService.getProducts(opportunity.id);
      setProducts(data);
    } catch {}
  };

  const loadCollaborators = async () => {
    try {
      const data = await salesOpportunityService.getCollaborators(opportunity.id);
      setCollaborators(data);
    } catch {}
  };

  const loadAttachments = async () => {
    try {
      const data = await salesOpportunityService.getAttachments(opportunity.id);
      setAttachments(data);
    } catch {}
  };

  const loadHistories = async () => {
    try {
      const res = await salesOpportunityService.getHistories(opportunity.id);
      setHistories(res.histories || []);
    } catch {}
  };

  const loadCatalog = async () => {
    try {
      const opt = await salesOpportunityService.getFormOptions();
      setUsersList(opt.users || []);
      const pRes = await getProducts({ per_page: '50' });
      setCatalogProducts(pRes.data || []);
    } catch {}
  };

  // Add Product (S5-03)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = catalogProducts.find((p) => String(p.id) === String(newProduct.product_id));
    const productName = prod ? prod.name : 'Sản phẩm / Dịch vụ tùy chọn';
    const unitPrice = newProduct.unit_price || (prod ? Number(prod.price) : 0);

    try {
      await salesOpportunityService.addProduct(opportunity.id, {
        product_id: newProduct.product_id ? Number(newProduct.product_id) : null,
        product_name: productName,
        quantity: newProduct.quantity,
        unit_price: unitPrice,
        discount_percentage: newProduct.discount_percentage,
        is_subscription: newProduct.is_subscription,
        subscription_billing_cycle: newProduct.subscription_billing_cycle,
        subscription_duration_months: newProduct.subscription_duration_months,
      });
      toast.success('Đã thêm sản phẩm và tự động cập nhật tổng giá trị cơ hội!');
      await loadProducts();
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleRemoveProduct = async (itemId: number) => {
    try {
      await salesOpportunityService.removeProduct(opportunity.id, itemId);
      toast.success('Đã xóa sản phẩm khỏi cơ hội.');
      await loadProducts();
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa');
    }
  };

  // Close Won (S5-05)
  const handleCloseWon = async () => {
    if (wonValue <= 0) {
      toast.error('Đóng Thắng bắt buộc nhập giá trị chốt thực tế lớn hơn 0.');
      return;
    }
    try {
      await salesOpportunityService.closeWon(opportunity.id, {
        actual_won_value: wonValue,
        contract_signed_at: signedDate,
      });
      toast.success('🎉 Chúc mừng! Thương vụ đã Đóng Thắng thành công!');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Đóng thắng thất bại');
    }
  };

  // Close Lost (S5-05)
  const handleCloseLost = async () => {
    if (!lossReason.trim()) {
      toast.error('Đóng Thua bắt buộc phải chọn hoặc nhập lý do.');
      return;
    }
    try {
      await salesOpportunityService.closeLost(opportunity.id, {
        loss_reason: lossReason,
        competitor_name: competitorName || undefined,
      });
      toast.success('Đã đóng cơ hội sang trạng thái Thua (Lost).');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Đóng thua thất bại');
    }
  };

  // Reopen (S5-05)
  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error('Trưởng nhóm mở lại cơ hội bắt buộc phải nhập lý do.');
      return;
    }
    try {
      await salesOpportunityService.reopen(opportunity.id, { reopen_reason: reopenReason });
      toast.success('Đã mở lại thương vụ thành công!');
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể mở lại');
    }
  };

  // Collaborators (S6-03)
  const handleAddCollaborator = async () => {
    if (!newCollaboratorUserId) return;
    try {
      await salesOpportunityService.addCollaborator(opportunity.id, {
        user_id: Number(newCollaboratorUserId),
        role_in_deal: newCollaboratorRole,
      });
      toast.success('Đã thêm đồng nghiệp cùng tham gia theo dõi cơ hội!');
      await loadCollaborators();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể chia sẻ');
    }
  };

  const handleRemoveCollaborator = async (collabId: number) => {
    try {
      await salesOpportunityService.removeCollaborator(opportunity.id, collabId);
      toast.success('Đã xóa thành viên cộng tác.');
      await loadCollaborators();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa');
    }
  };

  // Attachments (S6-04)
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Dung lượng tệp vượt quá giới hạn tối đa 20MB.');
      return;
    }

    setUploadingFile(true);
    try {
      await salesOpportunityService.uploadAttachment(opportunity.id, file);
      toast.success('Tải lên tệp đính kèm thành công!');
      await loadAttachments();
    } catch (err: any) {
      toast.error(err?.message || 'Tải lên thất bại');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '14px', width: '95%', maxWidth: '950px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                Cơ hội #{opportunity.id}
              </span>
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                {Number(opportunity.value || opportunity.amount || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, margin: '4px 0 0 0' }}>{opportunity.name}</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', padding: '12px 0', overflowX: 'auto' }}>
          {[
            { key: 'overview', label: 'Tổng quan & Khách hàng', icon: <Package size={15} /> },
            { key: 'products', label: `Sản phẩm & ACV (${products.length})`, icon: <Package size={15} /> },
            { key: 'close', label: 'Đóng / Mở thương vụ (Won/Lost)', icon: <Award size={15} /> },
            { key: 'collaborators', label: `Cộng tác viên (${collaborators.length})`, icon: <Users size={15} /> },
            { key: 'attachments', label: `Tài liệu đính kèm (${attachments.length})`, icon: <Paperclip size={15} /> },
            { key: 'history', label: `Lịch sử thay đổi (${histories.length})`, icon: <History size={15} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === tab.key ? '#2563eb' : '#f1f5f9',
                color: activeTab === tab.key ? '#fff' : '#475569',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1e293b' }}>Thông tin khách hàng & thương vụ</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Khách hàng:</strong> {opportunity.customer?.name} ({opportunity.customer?.code})</div>
                  <div><strong>Người liên hệ:</strong> {opportunity.contact?.name || 'Chưa gắn'} ({opportunity.contact?.phone || '—'})</div>
                  <div><strong>Giai đoạn:</strong> {opportunity.stage}</div>
                  <div><strong>Xác suất thắng:</strong> {opportunity.win_probability}%</div>
                  <div><strong>Ngày dự kiến chốt:</strong> {opportunity.expected_close_date ? new Date(opportunity.expected_close_date).toLocaleDateString('vi') : '—'}</div>
                  <div><strong>Người phụ trách:</strong> {opportunity.owner?.name}</div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#1e293b' }}>Trạng thái kết quả & Ghi chú</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><strong>Trạng thái:</strong> {opportunity.status === 'won' ? '🏆 Thắng (Won)' : opportunity.status === 'lost' ? '❌ Thua (Lost)' : '⏳ Đang mở (Open)'}</div>
                  {opportunity.status === 'won' && (
                    <>
                      <div><strong>Giá trị chốt thực tế:</strong> {Number((opportunity as any).actual_won_value || opportunity.value).toLocaleString('vi')} đ</div>
                      <div><strong>Ngày ký hợp đồng:</strong> {(opportunity as any).contract_signed_at || '—'}</div>
                    </>
                  )}
                  {opportunity.status === 'lost' && (
                    <>
                      <div><strong>Lý do thua:</strong> {(opportunity as any).loss_reason}</div>
                      <div><strong>Đối thủ thắng thầu:</strong> {(opportunity as any).competitor_name || 'Không rõ'}</div>
                    </>
                  )}
                  <div><strong>Ghi chú:</strong> {opportunity.notes || 'Không có ghi chú.'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SẢN PHẨM & DỊCH VỤ (S5-03) */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Form thêm sản phẩm */}
              <form onSubmit={handleAddProduct} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '2fr 80px 120px 80px auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Chọn sản phẩm / Dịch vụ</label>
                  <select
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={newProduct.product_id}
                    onChange={(e) => {
                      const p = catalogProducts.find((item) => String(item.id) === e.target.value);
                      setNewProduct({
                        ...newProduct,
                        product_id: e.target.value,
                        unit_price: p ? Number(p.price) : 0,
                      });
                    }}
                  >
                    <option value="">-- Chọn từ Bảng giá niêm yết --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({Number(p.price).toLocaleString('vi')} đ)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={newProduct.unit_price}
                    onChange={(e) => setNewProduct({ ...newProduct, unit_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>CK (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    value={newProduct.discount_percentage}
                    onChange={(e) => setNewProduct({ ...newProduct, discount_percentage: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="submit"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Thêm vào cơ hội
                </button>
              </form>

              {/* Bảng danh sách dòng sản phẩm */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Sản phẩm / Dịch vụ</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Chiết khấu</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Thành tiền</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.product_name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{p.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number(p.unit_price).toLocaleString('vi')} đ</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{p.discount_percentage}%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                          {Number(p.subtotal).toLocaleString('vi')} đ
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => void handleRemoveProduct(p.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có sản phẩm nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ĐÓNG / MỞ CƠ HỘI (S5-05) */}
          {activeTab === 'close' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* ĐÓNG THẮNG (WON) */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                  <CheckCircle size={18} /> Đóng Thắng (Close Won)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Giá trị chốt thực tế (VNĐ) *</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px' }}
                      value={wonValue}
                      onChange={(e) => setWonValue(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>Ngày ký hợp đồng *</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px' }}
                      value={signedDate}
                      onChange={(e) => setSignedDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseWon}
                    style={{ marginTop: '8px', padding: '9px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xác nhận Đóng Thắng & Tính chỉ tiêu
                  </button>
                </div>
              </div>

              {/* ĐÓNG THUA (LOST) */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                  <XCircle size={18} /> Đóng Thua (Close Lost)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>Lý do thua thương vụ *</label>
                    <select
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '13px' }}
                      value={lossReason}
                      onChange={(e) => setLossReason(e.target.value)}
                    >
                      <option value="Giá đối thủ cạnh tranh tốt hơn">Giá đối thủ cạnh tranh tốt hơn</option>
                      <option value="Khách hàng cắt giảm ngân sách / hoãn dự án">Khách hàng cắt giảm ngân sách / hoãn dự án</option>
                      <option value="Tính năng sản phẩm chưa đáp ứng yêu cầu">Tính năng sản phẩm chưa đáp ứng yêu cầu</option>
                      <option value="Thời gian giao hàng / triển khai không kịp">Thời gian giao hàng / triển khai không kịp</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>Đối thủ thắng thầu (nếu có)</label>
                    <input
                      placeholder="VD: Công ty Phần mềm ABC"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '13px' }}
                      value={competitorName}
                      onChange={(e) => setCompetitorName(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseLost}
                    style={{ marginTop: '8px', padding: '9px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xác nhận Đóng Thua
                  </button>
                </div>
              </div>

              {/* MỞ LẠI CƠ HỘI (REOPEN - CHỈ LEADER) */}
              {isLeader && (
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                    <RotateCcw size={16} /> Quyền Trưởng nhóm: Mở lại cơ hội đã đóng (Reopen)
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      placeholder="Bắt buộc nhập lý do mở lại cơ hội..."
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleReopen}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    >
                      Mở lại cơ hội
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THÀNH VIÊN THAM GIA (S6-03) */}
          {activeTab === 'collaborators' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <select
                  style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={newCollaboratorUserId}
                  onChange={(e) => setNewCollaboratorUserId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn nhân viên kinh doanh / kỹ thuật chia sẻ --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <input
                  style={{ width: '220px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  placeholder="Vai trò trong thương vụ"
                  value={newCollaboratorRole}
                  onChange={(e) => setNewCollaboratorRole(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCollaborator}
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Thêm thành viên
                </button>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nhân viên</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vai trò</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborators.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.user?.name}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{c.user?.email}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1e40af' }}>
                            {c.role_in_deal}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => void handleRemoveCollaborator(c.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {collaborators.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa chia sẻ cho ai.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TÀI LIỆU ĐÍNH KÈM (S6-04) */}
          {activeTab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Hỗ trợ tệp hồ sơ thầu, báo giá, hợp đồng tối đa 20MB.</span>
                <label style={{ padding: '7px 14px', borderRadius: '6px', background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {uploadingFile ? 'Đang tải lên...' : '+ Tải lên tài liệu'}
                  <input type="file" style={{ display: 'none' }} onChange={handleUploadFile} disabled={uploadingFile} />
                </label>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tên tài liệu</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Kích thước</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Người tải lên</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Thời gian</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.file_name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(a.file_size / 1024).toFixed(1)} KB</td>
                        <td style={{ padding: '8px 12px' }}>{a.uploader?.name}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{new Date(a.created_at).toLocaleString('vi')}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <a
                            href={`http://127.0.0.1:8000/api/v1/sales-opportunities/${opportunity.id}/attachments/${a.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2563eb', marginRight: '8px' }}
                            title="Tải xuống"
                          >
                            <Download size={15} />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {attachments.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có tệp đính kèm nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LỊCH SỬ THAY ĐỔI (S6-01) */}
          {activeTab === 'history' && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Trường thay đổi</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Giá trị trước</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Giá trị sau</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Người sửa</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Thời điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {histories.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.field_label || h.field_name}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{h.old_label || h.old_value || '—'}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16a34a' }}>{h.new_label || h.new_value || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>{h.changed_by_user?.name || `User #${h.changed_by_user_id}`}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{new Date(h.created_at).toLocaleString('vi')}</td>
                    </tr>
                  ))}
                  {histories.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Chưa có lịch sử thay đổi nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '13px' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export interface WinLossReason {
  id: number;
  type: 'Thắng' | 'Thua';
  name: string;
  description: string;
}

export interface Competitor {
  id: number;
  name: string;
  marketShare: string;
  notes: string;
}

const initialReasons: WinLossReason[] = [
  { id: 1, type: 'Thắng', name: 'Giá cả cạnh tranh', description: 'Chi phí tối ưu hơn so với đối thủ trên thị trường' },
  { id: 2, type: 'Thắng', name: 'Chất lượng tính năng vượt trội', description: 'Đáp ứng chính xác 100% yêu cầu kỹ thuật khắt khe' },
  { id: 3, type: 'Thua', name: 'Giá cao hơn ngân sách', description: 'Khách hàng không đủ nguồn tài chính đầu tư ban đầu' },
  { id: 4, type: 'Thua', name: 'Thời gian triển khai lâu', description: 'Đối thủ cam kết giao hàng và triển khai nhanh hơn' },
];

const initialCompetitors: Competitor[] = [
  { id: 1, name: 'Công ty Cổ phần Công nghệ ABC', marketShare: '35%', notes: 'Mạnh về phân khúc giá rẻ, dịch vụ hậu mãi tốt' },
  { id: 2, name: 'Global CRM Solutions Inc.', marketShare: '25%', notes: 'Thương hiệu quốc tế lớn, nhưng giao diện phức tạp khó dùng' },
  { id: 3, name: 'SmartBiz Platform', marketShare: '15%', notes: 'Tích hợp sẵn tổng đài và chat đa kênh mạnh mẽ' },
];

export default function WinLossCompetitorsPage() {
  const [activeTab, setActiveTab] = useState<'reasons' | 'competitors'>('reasons');
  const [reasons, setReasons] = useState<WinLossReason[]>(initialReasons);
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);

  // Modal Reasons
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reasonType, setReasonType] = useState<'Thắng' | 'Thua'>('Thắng');
  const [reasonName, setReasonName] = useState('');
  const [reasonDesc, setReasonDesc] = useState('');

  // Modal Competitor
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [compName, setCompName] = useState('');
  const [compShare, setCompShare] = useState('');
  const [compNotes, setCompNotes] = useState('');

  const handleSaveReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonName.trim()) {
      toast.error('Vui lòng nhập tên lý do');
      return;
    }
    setReasons([...reasons, {
      id: Date.now(),
      type: reasonType,
      name: reasonName.trim(),
      description: reasonDesc.trim(),
    }]);
    setIsReasonModalOpen(false);
    setReasonName('');
    setReasonDesc('');
    toast.success('Đã thêm lý do thắng/thua mới!');
  };

  const handleDeleteReason = (id: number) => {
    if (!window.confirm('Xóa lý do này?')) return;
    setReasons(reasons.filter(r => r.id !== id));
    toast.success('Đã xóa lý do');
  };

  const handleSaveCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      toast.error('Vui lòng nhập tên đối thủ');
      return;
    }
    setCompetitors([...competitors, {
      id: Date.now(),
      name: compName.trim(),
      marketShare: compShare.trim() || 'N/A',
      notes: compNotes.trim(),
    }]);
    setIsCompetitorModalOpen(false);
    setCompName('');
    setCompShare('');
    setCompNotes('');
    toast.success('Đã thêm đối thủ cạnh tranh mới!');
  };

  const handleDeleteCompetitor = (id: number) => {
    if (!window.confirm('Xóa đối thủ này?')) return;
    setCompetitors(competitors.filter(c => c.id !== id));
    toast.success('Đã xóa đối thủ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: '#0f766e', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Giám đốc kinh doanh
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>| Phân hệ Phân tích Cơ hội</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Lý do Thắng/Thua & Đối thủ cạnh tranh
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Khai báo các lý do thành công/thất bại khi chốt hợp đồng và lập hồ sơ theo dõi đối thủ.
          </p>
        </div>

        {activeTab === 'reasons' ? (
          <button className="primary" onClick={() => setIsReasonModalOpen(true)}>
            + Thêm Lý Do Mới
          </button>
        ) : (
          <button className="primary" onClick={() => setIsCompetitorModalOpen(true)}>
            + Thêm Đối Thủ Mới
          </button>
        )}
      </div>

      <div className="tabs" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          className={activeTab === 'reasons' ? 'selected' : ''}
          onClick={() => setActiveTab('reasons')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          🎯 Lý do Thắng / Thua Deal
        </button>
        <button
          className={activeTab === 'competitors' ? 'selected' : ''}
          onClick={() => setActiveTab('competitors')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          ⚔️ Đối thủ Cạnh tranh
        </button>
      </div>

      {activeTab === 'reasons' && (
        <div className="card" style={{ padding: '20px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Phân loại</th>
                  <th style={{ width: '260px' }}>Tên lý do</th>
                  <th>Mô tả chi tiết</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: r.type === 'Thắng' ? '#dcfce7' : '#fee2e2',
                        color: r.type === 'Thắng' ? '#166534' : '#991b1b'
                      }}>
                        {r.type === 'Thắng' ? '🏆 Thắng hợp đồng' : '❌ Thua hợp đồng'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>
                      {r.name}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {r.description || '---'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                        onClick={() => handleDeleteReason(r.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'competitors' && (
        <div className="card" style={{ padding: '20px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>Tên đối thủ cạnh tranh</th>
                  <th style={{ width: '160px' }}>Thị phần ước tính</th>
                  <th>Điểm nổi bật / Ghi chú</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>
                      🏢 {c.name}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>
                        {c.marketShare}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {c.notes || '---'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                        onClick={() => handleDeleteCompetitor(c.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Reason */}
      {isReasonModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm Lý Do Thắng / Thua Mới</h3>
              <button className="icon-button" onClick={() => setIsReasonModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveReason} style={{ marginTop: '16px' }}>
              <label>
                Phân loại:
                <select
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value as any)}
                >
                  <option value="Thắng">Thắng hợp đồng</option>
                  <option value="Thua">Thua hợp đồng</option>
                </select>
              </label>

              <label>
                Tên lý do: <span style={{ color: '#dc2626' }}>*</span>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giá cả cạnh tranh, Tính năng vượt trội..."
                  value={reasonName}
                  onChange={(e) => setReasonName(e.target.value)}
                />
              </label>

              <label>
                Mô tả chi tiết:
                <input
                  type="text"
                  placeholder="Nhập diễn giải cụ thể..."
                  value={reasonDesc}
                  onChange={(e) => setReasonDesc(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsReasonModalOpen(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu lý do</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Competitor */}
      {isCompetitorModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Thêm Đối Thủ Cạnh Tranh Mới</h3>
              <button className="icon-button" onClick={() => setIsCompetitorModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveCompetitor} style={{ marginTop: '16px' }}>
              <label>
                Tên đối thủ: <span style={{ color: '#dc2626' }}>*</span>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Giải pháp ABC..."
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                />
              </label>

              <label>
                Thị phần ước tính:
                <input
                  type="text"
                  placeholder="Ví dụ: 30%..."
                  value={compShare}
                  onChange={(e) => setCompShare(e.target.value)}
                />
              </label>

              <label>
                Điểm nổi bật / Ghi chú:
                <input
                  type="text"
                  placeholder="Thế mạnh, điểm yếu so với công ty..."
                  value={compNotes}
                  onChange={(e) => setCompNotes(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsCompetitorModalOpen(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu đối thủ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

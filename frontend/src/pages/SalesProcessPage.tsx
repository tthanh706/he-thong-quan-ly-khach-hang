import React, { useState } from 'react';
import toast from 'react-hot-toast';

export interface PipelineStage {
  id: number;
  order: number;
  name: string;
  probability: number;
  status: 'Hoạt động' | 'Tạm ngưng';
}

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

const defaultStages: PipelineStage[] = [
  { id: 1, order: 1, name: 'Tiếp nhận nhu cầu (Lead Qualified)', probability: 10, status: 'Hoạt động' },
  { id: 2, order: 2, name: 'Khảo sát & Gửi báo giá (Proposal)', probability: 40, status: 'Hoạt động' },
  { id: 3, order: 3, name: 'Đàm phán & Thương thảo (Negotiation)', probability: 70, status: 'Hoạt động' },
  { id: 4, order: 4, name: 'Chốt hợp đồng thành công (Closed Won)', probability: 100, status: 'Hoạt động' },
];

const defaultReasons: WinLossReason[] = [
  { id: 1, type: 'Thắng', name: 'Giá cả cạnh tranh', description: 'Chi phí tối ưu hơn so với đối thủ trên thị trường' },
  { id: 2, type: 'Thắng', name: 'Chất lượng tính năng vượt trội', description: 'Đáp ứng chính xác 100% yêu cầu kỹ thuật khắt khe' },
  { id: 3, type: 'Thua', name: 'Giá cao hơn ngân sách', description: 'Khách hàng không đủ nguồn tài chính đầu tư ban đầu' },
  { id: 4, type: 'Thua', name: 'Thời gian triển khai lâu', description: 'Đối thủ cam kết giao hàng và triển khai nhanh hơn' },
];

const defaultCompetitors: Competitor[] = [
  { id: 1, name: 'Công ty Cổ phần Công nghệ ABC', marketShare: '35%', notes: 'Mạnh về phân khúc giá rẻ, dịch vụ hậu mãi tốt' },
  { id: 2, name: 'Global CRM Solutions Inc.', marketShare: '25%', notes: 'Thương hiệu quốc tế lớn, nhưng giao diện phức tạp khó dùng' },
  { id: 3, name: 'SmartBiz Platform', marketShare: '15%', notes: 'Tích hợp sẵn tổng đài và chat đa kênh mạnh mẽ' },
];

export default function SalesProcessPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'reasons' | 'competitors'>('pipeline');

  // Pipeline State
  const [stages, setStages] = useState<PipelineStage[]>(defaultStages);
  const [stageSearch, setStageSearch] = useState('');
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [stageProbability, setStageProbability] = useState(50);
  const [stageStatus, setStageStatus] = useState<'Hoạt động' | 'Tạm ngưng'>('Hoạt động');

  // Reasons State
  const [reasons, setReasons] = useState<WinLossReason[]>(defaultReasons);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reasonType, setReasonType] = useState<'Thắng' | 'Thua'>('Thắng');
  const [reasonName, setReasonName] = useState('');
  const [reasonDesc, setReasonDesc] = useState('');

  // Competitors State
  const [competitors, setCompetitors] = useState<Competitor[]>(defaultCompetitors);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [compName, setCompName] = useState('');
  const [compShare, setCompShare] = useState('');
  const [compNotes, setCompNotes] = useState('');

  // Pipeline Handlers
  const handleOpenStageModal = (stage?: PipelineStage) => {
    if (stage) {
      setEditingStageId(stage.id);
      setStageName(stage.name);
      setStageOrder(stage.order);
      setStageProbability(stage.probability);
      setStageStatus(stage.status);
    } else {
      setEditingStageId(null);
      setStageName('');
      setStageOrder(stages.length + 1);
      setStageProbability(50);
      setStageStatus('Hoạt động');
    }
    setIsStageModalOpen(true);
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn');
      return;
    }
    if (editingStageId !== null) {
      setStages(stages.map(s => s.id === editingStageId ? {
        ...s,
        name: stageName.trim(),
        order: Number(stageOrder),
        probability: Number(stageProbability),
        status: stageStatus,
      } : s));
      toast.success('Cập nhật giai đoạn thành công!');
    } else {
      setStages([...stages, {
        id: Date.now(),
        order: Number(stageOrder),
        name: stageName.trim(),
        probability: Number(stageProbability),
        status: stageStatus,
      }]);
      toast.success('Thêm giai đoạn mới thành công!');
    }
    setIsStageModalOpen(false);
  };

  const handleDeleteStage = (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa giai đoạn này?')) return;
    setStages(stages.filter(s => s.id !== id));
    toast.success('Đã xóa giai đoạn');
  };

  // Reason Handlers
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
    toast.success('Đã thêm lý do mới!');
  };

  const handleDeleteReason = (id: number) => {
    if (!window.confirm('Xóa lý do này?')) return;
    setReasons(reasons.filter(r => r.id !== id));
    toast.success('Đã xóa lý do');
  };

  // Competitor Handlers
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

  const filteredStages = stages
    .filter(s => s.name.toLowerCase().includes(stageSearch.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Quy trình & Thiết lập Bán hàng
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Cấu hình phễu bán hàng (Pipeline), tỷ lệ chốt deal, lý do thắng/thua và đối thủ cạnh tranh.
          </p>
        </div>

        <div>
          {activeTab === 'pipeline' && (
            <button className="primary" onClick={() => handleOpenStageModal()}>
              + Thêm Giai Đoạn
            </button>
          )}
          {activeTab === 'reasons' && (
            <button className="primary" onClick={() => setIsReasonModalOpen(true)}>
              + Thêm Lý Do
            </button>
          )}
          {activeTab === 'competitors' && (
            <button className="primary" onClick={() => setIsCompetitorModalOpen(true)}>
              + Thêm Đối Thủ
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          className={activeTab === 'pipeline' ? 'selected' : ''}
          onClick={() => setActiveTab('pipeline')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          📈 Giai đoạn Pipeline & Xác suất
        </button>
        <button
          className={activeTab === 'reasons' ? 'selected' : ''}
          onClick={() => setActiveTab('reasons')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          🎯 Lý do Thắng / Thua hợp đồng
        </button>
        <button
          className={activeTab === 'competitors' ? 'selected' : ''}
          onClick={() => setActiveTab('competitors')}
          style={{ cursor: 'pointer', fontWeight: 600 }}
        >
          ⚔️ Đối thủ Cạnh tranh
        </button>
      </div>

      {/* Tab 1: Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm giai đoạn Pipeline..."
              value={stageSearch}
              onChange={(e) => setStageSearch(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Quy trình hiện tại: <strong>{filteredStages.length}</strong> bước
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Thứ tự</th>
                  <th>Tên giai đoạn Pipeline</th>
                  <th style={{ width: '280px' }}>Xác suất thành công</th>
                  <th style={{ width: '130px' }}>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStages.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '12px' }}>
                        Bước {s.order}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>
                      {s.name}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '6px', height: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <div style={{
                            width: `${s.probability}%`,
                            background: s.probability >= 80 ? '#16a34a' : s.probability >= 40 ? '#2563eb' : '#f59e0b',
                            height: '100%',
                            borderRadius: '6px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#1e293b', minWidth: '40px', fontSize: '13px' }}>
                          {s.probability}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${s.status === 'Hoạt động' ? 'active' : 'locked'}`}>
                        ● {s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        style={{ border: 'none', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', marginRight: '6px' }}
                        onClick={() => handleOpenStageModal(s)}
                      >
                        Sửa
                      </button>
                      <button
                        style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                        onClick={() => handleDeleteStage(s.id)}
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

      {/* Tab 2: Reasons */}
      {activeTab === 'reasons' && (
        <div className="card" style={{ padding: '20px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Phân loại</th>
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
                        {r.type === 'Thắng' ? '🏆 Thắng deal' : '❌ Thua deal'}
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

      {/* Tab 3: Competitors */}
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

      {/* Modal Stage */}
      {isStageModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingStageId !== null ? 'Cập nhật Giai đoạn' : 'Thêm Giai đoạn Mới'}</h3>
              <button className="icon-button" onClick={() => setIsStageModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveStage} style={{ marginTop: '16px' }}>
              <label>
                Tên giai đoạn Pipeline: <span style={{ color: '#dc2626' }}>*</span>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đàm phán giá, Ký hợp đồng..."
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Thứ tự bước:
                  <input
                    type="number"
                    min={1}
                    required
                    value={stageOrder}
                    onChange={(e) => setStageOrder(Number(e.target.value))}
                  />
                </label>
                <label>
                  Xác suất thắng (%):
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={stageProbability}
                    onChange={(e) => setStageProbability(Number(e.target.value))}
                  />
                </label>
              </div>

              <label>
                Trạng thái:
                <select
                  value={stageStatus}
                  onChange={(e) => setStageStatus(e.target.value as any)}
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsStageModalOpen(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu giai đoạn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reason */}
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

      {/* Modal Competitor */}
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

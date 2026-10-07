import React, { useState } from 'react';
import toast from 'react-hot-toast';

export interface PipelineStage {
  id: number;
  order: number;
  name: string;
  probability: number;
  status: 'Hoạt động' | 'Tạm ngưng';
}

const initialStages: PipelineStage[] = [
  { id: 1, order: 1, name: 'Tiếp nhận nhu cầu (Lead Qualified)', probability: 10, status: 'Hoạt động' },
  { id: 2, order: 2, name: 'Khảo sát & Gửi báo giá (Proposal)', probability: 40, status: 'Hoạt động' },
  { id: 3, order: 3, name: 'Đàm phán & Thương thảo (Negotiation)', probability: 70, status: 'Hoạt động' },
  { id: 4, order: 4, name: 'Chốt hợp đồng thành công (Closed Won)', probability: 100, status: 'Hoạt động' },
];

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [stageProbability, setStageProbability] = useState(50);
  const [stageStatus, setStageStatus] = useState<'Hoạt động' | 'Tạm ngưng'>('Hoạt động');

  const handleOpenModal = (stage?: PipelineStage) => {
    if (stage) {
      setEditingId(stage.id);
      setStageName(stage.name);
      setStageOrder(stage.order);
      setStageProbability(stage.probability);
      setStageStatus(stage.status);
    } else {
      setEditingId(null);
      setStageName('');
      setStageOrder(stages.length + 1);
      setStageProbability(50);
      setStageStatus('Hoạt động');
    }
    setIsModalOpen(true);
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) {
      toast.error('Vui lòng nhập tên giai đoạn Pipeline');
      return;
    }

    if (editingId !== null) {
      setStages(stages.map(s => s.id === editingId ? {
        ...s,
        name: stageName.trim(),
        order: Number(stageOrder),
        probability: Number(stageProbability),
        status: stageStatus,
      } : s));
      toast.success('Cập nhật giai đoạn Pipeline thành công!');
    } else {
      const newStage: PipelineStage = {
        id: Date.now(),
        order: Number(stageOrder),
        name: stageName.trim(),
        probability: Number(stageProbability),
        status: stageStatus,
      };
      setStages([...stages, newStage]);
      toast.success('Thêm mới giai đoạn Pipeline thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa giai đoạn này?')) return;
    setStages(stages.filter(s => s.id !== id));
    toast.success('Đã xóa giai đoạn Pipeline');
  };

  const filteredStages = stages
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: '#2563eb', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              Giám đốc kinh doanh
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>| Phân hệ Chiến lược</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Cấu hình Giai đoạn Pipeline & Xác suất thắng
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            Thiết lập các mốc quy trình trong phễu bán hàng và xác suất chốt deal tương ứng.
          </p>
        </div>

        <button className="primary" onClick={() => handleOpenModal()}>
          + Thêm Giai Đoạn Mới
        </button>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm giai đoạn Pipeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Tổng số: <strong>{filteredStages.length}</strong> giai đoạn
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Thứ tự</th>
                <th>Tên giai đoạn Pipeline</th>
                <th style={{ width: '300px' }}>Xác suất thành công (%)</th>
                <th style={{ width: '130px' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Thao tác</th>
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
                      onClick={() => handleOpenModal(s)}
                    >
                      Sửa
                    </button>
                    <button
                      style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: '6px' }}
                      onClick={() => handleDelete(s.id)}
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

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingId !== null ? 'Cập nhật Giai đoạn Pipeline' : 'Thêm Giai đoạn Pipeline Mới'}</h3>
              <button className="icon-button" onClick={() => setIsModalOpen(false)}>×</button>
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
                <button type="button" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="primary">Lưu giai đoạn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

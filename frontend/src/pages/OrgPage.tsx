import React, { useState } from 'react';

export interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  manager: string;
  type: 'company' | 'department' | 'team';
  children?: DepartmentNode[];
}

const initialOrgData: DepartmentNode[] = [
  {
    id: '1',
    name: 'Tổng Công Ty / Khối Kinh Doanh',
    code: 'KKD-00',
    manager: 'Giám đốc Kinh doanh (CCO)',
    type: 'company',
    children: [
      {
        id: '1-1',
        name: 'Phòng Kinh Doanh Miền Bắc',
        code: 'PKD-MB',
        manager: 'Trưởng phòng Kinh doanh Miền Bắc',
        type: 'department',
        children: [
          { id: '1-1-1', name: 'Nhóm Kinh Doanh 01 (Doanh Nghiệp)', code: 'N1-DN', manager: 'Trưởng nhóm A', type: 'team' },
          { id: '1-1-2', name: 'Nhóm Kinh Doanh 02 (Cá Nhân)', code: 'N2-CN', manager: 'Trưởng nhóm B', type: 'team' },
        ]
      },
      {
        id: '1-2',
        name: 'Phòng Kinh Doanh Miền Nam',
        code: 'PKD-MN',
        manager: 'Trưởng phòng Kinh doanh Miền Nam',
        type: 'department',
        children: [
          { id: '1-2-1', name: 'Nhóm Kinh Doanh Mới', code: 'N-KDM', manager: 'Trưởng nhóm C', type: 'team' }
        ]
      }
    ]
  }
];

export default function OrgPage() {
  const [orgTree, setOrgTree] = useState<DepartmentNode[]>(initialOrgData);
  const [selectedNode, setSelectedNode] = useState<DepartmentNode | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [manager, setManager] = useState('');
  const [parentId, setParentId] = useState<string>('1');
  const [type, setType] = useState<'department' | 'team'>('department');

  const getFlattenNodes = (nodes: DepartmentNode[]): { id: string; name: string }[] => {
    let list: { id: string; name: string }[] = [];
    nodes.forEach(node => {
      list.push({ id: node.id, name: node.name });
      if (node.children) {
        list = list.concat(getFlattenNodes(node.children));
      }
    });
    return list;
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return alert('Vui lòng nhập Tên phòng/nhóm và Mã đơn vị');

    const newUnit: DepartmentNode = {
      id: Date.now().toString(),
      name,
      code,
      manager: manager || 'Chưa phân công',
      type
    };

    const insertNode = (nodes: DepartmentNode[]): DepartmentNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newUnit] };
        }
        if (node.children) {
          return { ...node, children: insertNode(node.children) };
        }
        return node;
      });
    };

    setOrgTree(insertNode(orgTree));
    setName(''); setCode(''); setManager('');
    setShowModal(false);
  };

  const handleDeleteUnit = (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) return;
    const removeNode = (nodes: DepartmentNode[]): DepartmentNode[] => {
      return nodes
        .filter(node => node.id !== id)
        .map(node => ({
          ...node,
          children: node.children ? removeNode(node.children) : undefined
        }));
    };
    setOrgTree(removeNode(orgTree));
    setSelectedNode(null);
  };

  const renderTree = (nodes: DepartmentNode[]) => {
    return (
      <ul style={{ listStyleType: 'none', paddingLeft: '24px', margin: '8px 0' }}>
        {nodes.map(node => (
          <li key={node.id} style={{ marginBottom: '10px' }}>
            <div 
              onClick={() => setSelectedNode(node)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minWidth: '340px',
                padding: '10px 16px',
                backgroundColor: selectedNode?.id === node.id ? '#eff6ff' : '#ffffff',
                border: selectedNode?.id === node.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{node.type === 'company' ? '🏢' : node.type === 'department' ? '📁' : '👥'}</span>
                <span style={{ fontWeight: node.type === 'company' ? 600 : 400, color: '#0f172a', fontSize: '14px' }}>{node.name}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                {node.code}
              </span>
            </div>
            {node.children && node.children.length > 0 && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 6px 0' }}>
            Cơ cấu Tổ chức Doanh nghiệp
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Quản lý sơ đồ phòng ban, đơn vị trực thuộc và các nhóm kinh doanh.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          + Thêm đơn vị / Nhóm
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Tree Panel */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Sơ đồ Cây Đơn vị
          </h3>
          <div style={{ marginLeft: '-24px' }}>
            {renderTree(orgTree)}
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', height: 'fit-content', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Chi tiết Đơn vị
          </h3>
          
          {selectedNode ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tên đơn vị</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedNode.name}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Mã phòng ban</span>
                <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>{selectedNode.code}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Cấp bậc / Phân loại</span>
                <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedNode.type === 'company' ? 'Doanh nghiệp / Tổng công ty' : selectedNode.type === 'department' ? 'Phòng ban' : 'Đội nhóm'}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Trưởng bộ phận</span>
                <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>{selectedNode.manager}</div>
              </div>

              {selectedNode.type !== 'company' && (
                <button 
                  onClick={() => handleDeleteUnit(selectedNode.id)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    color: '#ef4444',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Xóa đơn vị này
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              Chọn một đơn vị từ cây sơ đồ để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Unit */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', width: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 20px 0' }}>
              Thêm Đơn vị / Phòng ban Mới
            </h3>

            <form onSubmit={handleAddUnit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Trực thuộc đơn vị</label>
                <select 
                  value={parentId} 
                  onChange={(e) => setParentId(e.target.value)}
                  style={inputStyle}
                >
                  {getFlattenNodes(orgTree).map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Phân cấp</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as 'department' | 'team')}
                  style={inputStyle}
                >
                  <option value="department">Phòng ban</option>
                  <option value="team">Nhóm kinh doanh</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Tên đơn vị <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ví dụ: Phòng Kế Toán..."
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Mã đơn vị <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="Ví dụ: PKT-01..."
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Trưởng bộ phận</label>
                <input 
                  type="text" 
                  value={manager} 
                  onChange={(e) => setManager(e.target.value)} 
                  placeholder="Họ và tên người quản lý..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Lưu Đơn vị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

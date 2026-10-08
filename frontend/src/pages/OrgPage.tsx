import React, { useState } from 'react';

interface DepartmentNode {
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

export const OrgPage: React.FC = () => {
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
            Cơ cấu Tổ chức Kinh doanh
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Quản lý sơ đồ phòng ban, đơn vị trực thuộc và các nhóm kinh doanh.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>+</span> Thêm đơn vị / nhóm
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Sơ đồ Cây Tổ chức
          </h3>
          {renderTree(orgTree)}
        </div>

        <div>
          {selectedNode ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Thông tin Chi tiết
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Mã đơn vị:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedNode.code}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Tên đơn vị:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedNode.name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Quản lý / Trưởng nhóm:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{selectedNode.manager}</div>
                </div>

                {selectedNode.type !== 'company' && (
                  <button 
                    onClick={() => handleDeleteUnit(selectedNode.id)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 14px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🗑️ Xóa đơn vị này
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Bấm vào một đơn vị trong cây sơ đồ để xem thông tin chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Thêm Phòng ban / Nhóm mới</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddUnit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Trực thuộc đơn vị</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)} style={inputStyle}>
                  {getFlattenNodes(orgTree).map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Phân loại</label>
                <select value={type} onChange={e => setType(e.target.value as any)} style={inputStyle}>
                  <option value="department">Phòng ban kinh doanh</option>
                  <option value="team">Nhóm kinh doanh trực thuộc</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tên Phòng / Nhóm *</label>
                <input placeholder="VD: Phòng Kinh Doanh Miền Trung" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Mã đơn vị *</label>
                <input placeholder="VD: PKD-MT" value={code} onChange={e => setCode(e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Quản lý / Trưởng nhóm</label>
                <input placeholder="VD: Nguyễn Văn A" value={manager} onChange={e => setManager(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
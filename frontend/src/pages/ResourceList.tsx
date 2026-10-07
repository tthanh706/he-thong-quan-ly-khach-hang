import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exportScopedResource, useScopedResource } from '../hooks/useScopedResource';
import type { ResourceName } from '../hooks/useScopedResource';
import type { ScopedRecord } from '../types';

export default function ResourceList({ resource, title, singular, exportName }: { resource: ResourceName; title: string; singular: string; exportName: string }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data = [], isLoading, isError } = useScopedResource(resource, search);

  return <section>
    <h1>{title}</h1>
    <p className="hint">Danh sách được backend tự động lọc theo phạm vi MINE / TEAM / ALL của tài khoản đăng nhập.</p>
    <div className="toolbar">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Tìm ${singular}...`} />
      <button onClick={() => exportScopedResource(resource, search, exportName)}>Xuất Excel</button>
    </div>
    {isLoading && <p>Đang tải dữ liệu...</p>}
    {isError && <p>Không thể tải dữ liệu.</p>}
    <div className="cards">
      {data.map((item: ScopedRecord) => <article key={item.id} className="record-card" onClick={() => navigate(`/${resource}/${item.id}`)}>
        <strong>{item.name}</strong>
        <span>{item.status || 'Chưa có trạng thái'}</span>
        <small>Người phụ trách: {item.ownerName || item.owner_id}</small>
      </article>)}
    </div>
  </section>;
}

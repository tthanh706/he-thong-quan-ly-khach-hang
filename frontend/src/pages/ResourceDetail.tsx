import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { ScopedRecord } from '../types';
import type { ResourceName } from '../hooks/useScopedResource';

export default function ResourceDetail({ resource, title }: { resource: ResourceName; title: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ScopedRecord | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    api.get<{ data: ScopedRecord }>(`/${resource}/${id}`).then((r: any) => setItem(r.data ?? r)).catch(() => setFailed(true));
  }, [id, resource]);

  return <section>
    <button onClick={() => navigate(`/${resource}`)}>← Quay lại</button>
    <h1>{title}</h1>
    {failed && <p className="error">Không thể xem bản ghi này. Nếu nằm ngoài phạm vi, hệ thống sẽ thông báo quyền truy cập.</p>}
    {item && <div className="detail-card">
      <p><b>ID:</b> {item.id}</p><p><b>Tên:</b> {item.name}</p><p><b>Trạng thái:</b> {item.status || '-'}</p>
      <p><b>Người phụ trách:</b> {item.ownerName}</p><p><b>Mô tả:</b> {item.description || '-'}</p>
    </div>}
  </section>;
}

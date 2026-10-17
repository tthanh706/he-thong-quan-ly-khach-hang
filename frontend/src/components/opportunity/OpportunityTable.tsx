import type { Opportunity } from '../../types/opportunity';

interface Props {
  opportunities: Opportunity[];
  onActivity: (opportunity: Opportunity) => void;
}

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    new: 'Mới',
    consulting: 'Đang tư vấn',
    negotiation: 'Đàm phán',
    contract: 'Chờ hợp đồng',
  };
  return map[stage] ?? stage;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-';
}

export default function OpportunityTable({ opportunities, onActivity }: Props) {
  if (opportunities.length === 0) {
    return <div className="empty-state">Không có cơ hội phù hợp.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cơ hội</th>
            <th>Giai đoạn</th>
            <th>Phụ trách</th>
            <th>Giá trị</th>
            <th>Hoạt động cuối</th>
            <th>Ngày dự kiến chốt</th>
            <th>Cảnh báo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.name}</strong><div className="muted">#{item.id}</div></td>
              <td>{stageLabel(item.stage)}</td>
              <td>{item.owner?.name ?? '-'}</td>
              <td>{Number(item.value).toLocaleString('vi-VN')} đ</td>
              <td>{item.last_activity_at ? new Date(item.last_activity_at).toLocaleString('vi-VN') : 'Chưa có'}</td>
              <td>{formatDate(item.expected_close_date)}</td>
              <td>
                <div className="badges">
                  {item.has_stagnation_warning && <span className="badge danger">Đình trệ</span>}
                  {item.has_overdue_close_warning && <span className="badge warning">Quá ngày chốt</span>}
                  {!item.has_stagnation_warning && !item.has_overdue_close_warning && <span className="badge ok">Bình thường</span>}
                </div>
              </td>
              <td><button className="primary-button small" onClick={() => onActivity(item)}>Ghi nhận hoạt động</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

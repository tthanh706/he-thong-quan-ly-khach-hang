interface Props {
  total: number;
  stagnant: number;
  overdue: number;
  totalValue: number;
}

export default function StatCards({ total, stagnant, overdue, totalValue }: Props) {
  return (
    <div className="stats-grid">
      <div className="stat-card"><span>Cơ hội cần chú ý</span><strong>{total}</strong></div>
      <div className="stat-card"><span>Đình trệ</span><strong>{stagnant}</strong></div>
      <div className="stat-card"><span>Quá ngày chốt</span><strong>{overdue}</strong></div>
      <div className="stat-card"><span>Giá trị đang cảnh báo</span><strong>{totalValue.toLocaleString('vi-VN')} đ</strong></div>
    </div>
  );
}

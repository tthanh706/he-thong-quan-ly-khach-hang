interface Props {
  search: string;
  stage: string;
  warning: string;
  onSearchChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onWarningChange: (value: string) => void;
  onRefresh: () => void;
}

export default function FilterBar(props: Props) {
  return (
    <div className="filter-bar">
      <input
        placeholder="Tìm theo tên cơ hội..."
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
      />
      <select value={props.stage} onChange={(e) => props.onStageChange(e.target.value)}>
        <option value="">Tất cả giai đoạn</option>
        <option value="new">Mới</option>
        <option value="consulting">Đang tư vấn</option>
        <option value="negotiation">Đàm phán</option>
        <option value="contract">Chờ hợp đồng</option>
      </select>
      <select value={props.warning} onChange={(e) => props.onWarningChange(e.target.value)}>
        <option value="">Tất cả cảnh báo</option>
        <option value="stagnant">Đình trệ</option>
        <option value="overdue_close">Quá ngày chốt</option>
        <option value="both">Có cả hai cảnh báo</option>
      </select>
      <button className="secondary-button" onClick={props.onRefresh}>Làm mới</button>
    </div>
  );
}

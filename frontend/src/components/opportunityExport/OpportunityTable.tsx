import type { OpportunityCustomField, OpportunityRow } from '../../types/opportunityExport';

interface OpportunityTableProps {
  rows: OpportunityRow[];
  customFields: OpportunityCustomField[];
  canViewFinancials: boolean;
  loading: boolean;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function OpportunityTable({
  rows,
  customFields,
  canViewFinancials,
  loading
}: OpportunityTableProps) {
  if (loading) {
    return <div className="empty-state">Đang tải danh sách cơ hội...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        Không có cơ hội phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="opportunity-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên cơ hội</th>
            <th>Người phụ trách</th>
            <th>Giai đoạn</th>
            <th>Trạng thái</th>
            <th>Giá trị</th>
            <th>Ngày dự kiến chốt</th>
            <th>Loại cơ hội</th>

            {canViewFinancials && (
              <>
                <th>Giá vốn</th>
                <th>Biên lợi nhuận</th>
              </>
            )}

            {customFields.map((field) => (
              <th key={field.id}>{field.name}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>

              <td>
                <strong>{row.name}</strong>
                <small>#{row.id}</small>
              </td>

              <td>{row.owner ?? 'Chưa phân công'}</td>
              <td>
                <span className="tag tag-stage">{row.stage}</span>
              </td>
              <td>
                <span className="tag tag-status">{row.status}</span>
              </td>
              <td>{formatMoney(row.value)}</td>
              <td>{row.expected_close_date ?? '-'}</td>
              <td>{row.opportunity_type ?? '-'}</td>

              {canViewFinancials && (
                <>
                  <td>{formatMoney(row.cost_price ?? 0)}</td>
                  <td>
                    <span
                      className={
                        (row.profit_margin ?? 0) >= 30
                          ? 'margin-positive'
                          : 'margin-warning'
                      }
                    >
                      {(row.profit_margin ?? 0).toFixed(2)}%
                    </span>
                  </td>
                </>
              )}

              {customFields.map((field) => (
                <td key={field.id}>
                  {row[`custom_${field.field_key}`] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

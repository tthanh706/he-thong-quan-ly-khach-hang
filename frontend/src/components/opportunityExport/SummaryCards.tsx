import type { OpportunityRow } from '../../types';

interface SummaryCardsProps {
  rows: OpportunityRow[];
  canViewFinancials: boolean;
}

function money(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function SummaryCards({
  rows,
  canViewFinancials
}: SummaryCardsProps) {
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const totalCost = rows.reduce(
    (sum, row) => sum + (row.cost_price ?? 0),
    0
  );

  const averageMargin =
    rows.length > 0
      ? rows.reduce(
          (sum, row) => sum + (row.profit_margin ?? 0),
          0
        ) / rows.length
      : 0;

  return (
    <section className="summary-grid">
      <article className="summary-card">
        <span>Số cơ hội</span>
        <strong>{rows.length}</strong>
      </article>

      <article className="summary-card">
        <span>Tổng giá trị</span>
        <strong>{money(totalValue)}</strong>
      </article>

      {canViewFinancials && (
        <>
          <article className="summary-card">
            <span>Tổng giá vốn</span>
            <strong>{money(totalCost)}</strong>
          </article>

          <article className="summary-card">
            <span>Biên lợi nhuận TB</span>
            <strong>{averageMargin.toFixed(2)}%</strong>
          </article>
        </>
      )}
    </section>
  );
}

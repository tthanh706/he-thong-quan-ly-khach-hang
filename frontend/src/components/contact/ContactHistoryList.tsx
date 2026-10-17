import type { ContactHistory } from '../../types';

interface ContactHistoryListProps {
  history: ContactHistory[];
  loading: boolean;
}

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

export const ContactHistoryList = ({ history, loading }: ContactHistoryListProps) => {
  if (loading) return <div className="py-8 text-center text-slate-500">Đang tải lịch sử...</div>;
  if (history.length === 0) return <div className="py-8 text-center text-slate-500">Chưa có lịch sử chuyển công ty.</div>;

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-4" style={{ marginBottom: '10px' }}>
          <div className="flex flex-wrap items-center gap-2 text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-semibold text-slate-900" style={{ fontWeight: 600 }}>
              {item.oldCustomerName || item.old_customer?.name || (item.oldCustomerId ? `Công ty #${item.oldCustomerId}` : 'Chưa gán')}
            </span>
            <span className="text-slate-400" style={{ color: '#94a3b8' }}>➔</span>
            <span className="font-semibold text-blue-700" style={{ fontWeight: 600, color: '#2563eb' }}>
              {item.newCustomerName || item.new_customer?.name || (item.newCustomerId ? `Công ty #${item.newCustomerId}` : 'Chưa gán')}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500" style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
            Thời gian: {formatDate(item.changedAt || item.changed_at || null)}
          </div>
        </div>
      ))}
    </div>
  );
};

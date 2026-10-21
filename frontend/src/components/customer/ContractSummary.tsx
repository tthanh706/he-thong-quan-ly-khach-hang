import { FileText, Landmark } from 'lucide-react';
import type { GroupContractValue } from '../../types/customerHierarchy';

interface ContractSummaryProps {
  data: GroupContractValue | null;
  loading: boolean;
}

const formatMoney = (value: string): string => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ContractSummary = ({ data, loading }: ContractSummaryProps) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Đang tải giá trị hợp đồng...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Chọn một công ty trong cây để xem tổng giá trị hợp đồng của nhóm.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Landmark className="h-4 w-4" /> Nhóm công ty
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {data.group_customer_ids.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">công ty trong phạm vi tính</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <FileText className="h-4 w-4" /> Số hợp đồng
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.contracts.length}</div>
          <div className="mt-1 text-xs text-slate-500">hợp đồng của toàn nhóm</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="mb-2 text-sm font-medium text-blue-700">Tổng giá trị hợp đồng</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatMoney(data.total_contract_value)}
          </div>
          <div className="mt-1 text-xs text-blue-700">{data.customer_name}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Chi tiết hợp đồng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Mã HĐ</th>
                <th className="px-5 py-3">Tên hợp đồng</th>
                <th className="px-5 py-3">Công ty</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    Chưa có hợp đồng trong nhóm công ty này.
                  </td>
                </tr>
              ) : (
                data.contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {contract.contract_code}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{contract.contract_name}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {contract.customer?.name ?? `#${contract.customer_id}`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{contract.status}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatMoney(contract.contract_value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Company } from '../../types';
import { Search, Plus, Building2, MapPin, Mail, Phone, Edit, Trash2 } from 'lucide-react';

interface CustomerListProps {
  companies: Company[];
  onAdd: () => void;
  onEdit: (c: Company) => void;
  onDelete: (id: string) => void;
  onView360?: (c: Company) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ companies, onAdd, onEdit, onDelete, onView360 }) => {
  const [search, setSearch] = useState('');
  const filtered = companies.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.taxCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút thêm */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Giao diện Khách hàng</h2>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Bảng danh sách doanh nghiệp */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên công ty, mã số thuế, ngành nghề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-xs text-gray-600 uppercase border-b">
              <th className="py-3 px-6">Tên công ty</th>
              <th className="py-3 px-6">Mã số thuế & Ngành</th>
              <th className="py-3 px-6">Địa chỉ</th>
              <th className="py-3 px-6">Liên lạc</th>
              <th className="py-3 px-6 text-center">Phân hạng</th>
              <th className="py-3 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                {/* Tên công ty */}
                <td className="py-4 px-6 font-semibold text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{c.name}</span>
                  </div>
                </td>

                {/* MST & Ngành nghề */}
                <td className="py-4 px-6 text-gray-600">
                  <div className="text-xs font-medium text-gray-900">MST: {c.taxCode}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.industry}</div>
                </td>

                {/* Địa chỉ */}
                <td className="py-4 px-6 text-gray-600 text-xs max-w-xs truncate">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{c.address || '—'}</span>
                  </div>
                </td>

                {/* Liên lạc */}
                <td className="py-4 px-6 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{c.email || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{c.phone || '—'}</span>
                  </div>
                </td>

                {/* Phân hạng */}
                <td className="py-4 px-6 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.tier === 'Enterprise'
                        ? 'bg-blue-100 text-blue-800'
                        : c.tier === 'SME'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {c.tier}
                  </span>
                </td>

                {/* Thao tác */}
                <td className="py-4 px-6 text-right space-x-2">
                  {onView360 && (
                    <button 
                      onClick={() => onView360(c)} 
                      className="text-emerald-600 p-1 hover:bg-emerald-50 rounded font-medium text-xs inline-flex items-center gap-1"
                      title="Xem toàn cảnh Khách hàng 360°"
                    >
                      <span>🌐 360°</span>
                    </button>
                  )}
                  <button onClick={() => onEdit(c)} className="text-blue-600 p-1 hover:bg-blue-50 rounded" title="Sửa thông tin">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(c.id)} className="text-red-600 p-1 hover:bg-red-50 rounded" title="Xóa khách hàng">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
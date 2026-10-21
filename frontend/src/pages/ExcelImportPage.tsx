import React, { useState } from 'react';

export const ExcelImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessage('');
    
    // Giả lập preview đọc file
    setTimeout(() => {
      setPreview([
        { row: 1, name: 'Công ty TNHH Ánh Dương', phone: '0901234567', email: 'anhduong@gmail.com', status: 'Hợp lệ' },
        { row: 2, name: 'Cửa hàng Cơ khí Hoàng Nam', phone: '0912345678', email: 'hoangnam@gmail.com', status: 'Hợp lệ' },
        { row: 3, name: 'Doanh nghiệp Tư nhân Mai Linh', phone: '0988776655', email: 'mailinh@gmail.com', status: 'Hợp lệ' },
      ]);
      setLoading(false);
      setMessage('Tải trước file thành công. Vui lòng kiểm tra dữ liệu trước khi lưu.');
    }, 800);
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">📥 IMPORT KHÁCH HÀNG TỪ EXCEL</h1>
        <p className="text-slate-400 text-sm mt-1">Hỗ trợ các định dạng file: .xlsx, .xls, .csv</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl">
        <div className="flex flex-col gap-4">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
          />

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition"
          >
            {loading ? 'Đang đọc dữ liệu...' : 'Tải lên & Xem trước'}
          </button>
        </div>

        {message && <p className="mt-4 text-emerald-400 text-sm">{message}</p>}
      </div>

      {preview.length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Xem trước danh sách ({preview.length} dòng)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Tên khách hàng</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.row} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-3">{row.row}</td>
                    <td className="p-3 font-medium text-white">{row.name}</td>
                    <td className="p-3">{row.phone}</td>
                    <td className="p-3">{row.email}</td>
                    <td className="p-3 text-emerald-400">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImportPage;

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { User } from '../types';

export function AccountPage() {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [replacementId, setReplacementId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      const result = await api<{ data: User[] }>('/accounts');
      setAccounts(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const activeTargets = useMemo(
    () => accounts.filter((account) => !account.locked_at && account.id !== selected?.id),
    [accounts, selected],
  );

  async function lockAccount() {
    if (!selected || !replacementId) return;
    try {
      const result = await api<{ message: string; data: { customers: number; opportunities: number } }>(
        `/accounts/${selected.id}/lock`,
        { method: 'POST', body: JSON.stringify({ replacement_user_id: Number(replacementId) }) },
      );
      setMessage(`${result.message} ${result.data.customers} khách hàng, ${result.data.opportunities} cơ hội đã được bàn giao.`);
      setSelected(null);
      setReplacementId('');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể khóa tài khoản.');
    }
  }

  return (
    <section>
      <div className="page-title"><div><h2>Tài khoản</h2><p>Khóa tài khoản và bàn giao toàn bộ dữ liệu sở hữu.</p></div></div>
      {message && <div className="notice">{message}<button onClick={() => setMessage('')}>×</button></div>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Nhân viên</th><th>Email</th><th>Trạng thái</th><th>Khách hàng</th><th>Cơ hội</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6}>Đang tải...</td></tr> : accounts.map((account) => (
              <tr key={account.id}>
                <td><strong>{account.name}</strong></td>
                <td>{account.email}</td>
                <td><span className={`status ${account.locked_at ? 'locked' : 'active'}`}>{account.locked_at ? 'Đã khóa' : 'Đang hoạt động'}</span></td>
                <td>{account.customers_count ?? 0}</td>
                <td>{account.opportunities_count ?? 0}</td>
                <td>{!account.locked_at && <button className="danger" onClick={() => setSelected(account)}>Khóa & bàn giao</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <Modal title={`Khóa tài khoản ${selected.name}`} onClose={() => setSelected(null)}>
        <p>Toàn bộ khách hàng và cơ hội sẽ được chuyển sang người tiếp nhận. Sau khi hoàn tất, các phiên đăng nhập của tài khoản này sẽ bị thu hồi.</p>
        <label>Người tiếp nhận *
          <select value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
            <option value="">-- Chọn người tiếp nhận --</option>
            {activeTargets.map((account) => <option key={account.id} value={account.id}>{account.name} — {account.email}</option>)}
          </select>
        </label>
        <div className="modal-actions"><button onClick={() => setSelected(null)}>Hủy</button><button className="danger" disabled={!replacementId} onClick={() => void lockAccount()}>Xác nhận khóa</button></div>
      </Modal>}
    </section>
  );
}

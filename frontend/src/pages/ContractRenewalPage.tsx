import { useEffect, useMemo, useState } from 'react';
import type { Contract, CurrentUser, ExpiryAlert, ExpirySetting } from '../types';
import {
  checkExpiry,
  createRenewalOpportunity,
  getAlerts,
  getContracts,
  getExpirySetting,
  updateExpirySetting,
} from '../services/contractService';
import { useAuth } from '../hooks/useAuth';
import './ContractRenewalPage.css';

function money(v: string | number) {
  return Number(v).toLocaleString('vi-VN') + ' ₫';
}

function date(v: string | null) {
  return v ? new Date(v + 'T00:00:00').toLocaleDateString('vi-VN') : '-';
}

interface Props {
  user?: CurrentUser;
  onLogout?: () => void;
}

export default function ContractRenewalPage({ user: propUser }: Props) {
  const { user: authUser } = useAuth();
  const user: CurrentUser = (propUser || authUser || {
    id: 1,
    name: 'Người dùng',
    email: 'user@example.com',
    role: 'staff',
  }) as CurrentUser;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [setting, setSetting] = useState<ExpirySetting | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [onlyWarning, setOnlyWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [warningDays, setWarningDays] = useState(30);
  const [active, setActive] = useState(true);
  const [renewing, setRenewing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [c, a, s] = await Promise.all([
        getContracts({ status: status || undefined, search: search || undefined, onlyWarning }),
        getAlerts(),
        getExpirySetting(),
      ]);
      setContracts(c.data);
      setAlerts(a.data);
      setSetting(s.data);
      setWarningDays(s.data.warning_days);
      setActive(s.data.is_active);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status, onlyWarning]);

  const stats = useMemo(
    () => ({
      total: contracts.length,
      expiring: contracts.filter((c) => c.days_remaining >= 0 && c.alerts?.some((a) => a.type === 'expiring_soon')).length,
      expired: contracts.filter((c) => c.status === 'expired' || c.days_remaining < 0).length,
      renewed: contracts.filter((c) => c.renewal_opportunity).length,
    }),
    [contracts]
  );

  async function saveSetting() {
    try {
      await updateExpirySetting(warningDays, active);
      setMsg('Đã lưu cấu hình cảnh báo.');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi lưu cấu hình.');
    }
  }

  async function check() {
    try {
      const r = await checkExpiry();
      setMsg(`Đã kiểm tra: ${r.data.expiring_soon_count} sắp hết hạn, ${r.data.expired_count} đã hết hạn.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi kiểm tra.');
    }
  }

  async function renew(c: Contract) {
    setRenewing(c.id);
    try {
      await createRenewalOpportunity(c.id);
      setMsg(`Đã tạo cơ hội gia hạn cho hợp đồng ${c.contract_code}.`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi tạo cơ hội gia hạn.');
    } finally {
      setRenewing(null);
    }
  }

  return (
    <div className="contract-renewal-page" style={{ padding: '24px' }}>
      <header className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <small style={{ color: '#2563eb', fontWeight: 600, fontSize: '13px' }}>S7-07 · CONTRACT RENEWAL</small>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>Hiệu lực & gia hạn hợp đồng</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Theo dõi ngày hết hạn, cảnh báo sớm và tạo cơ hội gia hạn hợp đồng.</p>
        </div>
      </header>

      {msg && <div className="success" style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{msg}</div>}
      {err && <div className="error" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{err}</div>}

      <section className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng hợp đồng</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px' }}>{stats.total}</strong>
        </div>
        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Sắp hết hạn</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#d97706' }}>{stats.expiring}</strong>
          <small style={{ color: '#94a3b8' }}>Ngưỡng {setting?.warning_days ?? 30} ngày</small>
        </div>
        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Đã hết hạn</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#dc2626' }}>{stats.expired}</strong>
        </div>
        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>Đã tạo cơ hội gia hạn</span>
          <strong style={{ display: 'block', fontSize: '24px', marginTop: '4px', color: '#16a34a' }}>{stats.renewed}</strong>
        </div>
      </section>

      <section className="grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Cấu hình cảnh báo hết hạn</h3>
          <label style={{ display: 'grid', gap: '6px', marginBottom: '12px', fontSize: '13px', fontWeight: 500 }}>
            Ngưỡng số ngày báo trước
            <input
              type="number"
              min="1"
              max="365"
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </label>
          <label className="check" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '13px' }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Bật cảnh báo tự động
          </label>
          <button onClick={saveSetting} style={{ padding: '8px 16px', borderRadius: '6px', border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            Lưu cấu hình
          </button>
        </div>

        <div className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Kiểm tra thời hạn</h3>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px' }}>Quét lại toàn bộ hợp đồng hiện có để cập nhật cảnh báo tức thời.</p>
          <button onClick={check} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>
            Kiểm tra ngay
          </button>
        </div>
      </section>

      <section className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div className="title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Cảnh báo hợp đồng</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Các hợp đồng sắp hoặc đã quá hạn cần xử lý.</p>
          </div>
          <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
            {alerts.length} cảnh báo
          </span>
        </div>
        <div className="alerts" style={{ display: 'grid', gap: '10px' }}>
          {alerts.length === 0 ? (
            <p className="muted" style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Chưa có cảnh báo nào.</p>
          ) : (
            alerts.map((a) => (
              <div
                className={`alert ${a.type}`}
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  borderLeft: a.type === 'expired' ? '4px solid #ef4444' : '4px solid #f59e0b',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <b style={{ color: a.type === 'expired' ? '#dc2626' : '#d97706', fontSize: '14px' }}>
                    {a.type === 'expired' ? 'Đã hết hạn' : 'Sắp hết hạn'}
                  </b>
                  <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '13px' }}>{a.message}</p>
                </div>
                <small style={{ color: '#94a3b8' }}>{a.detected_at ? new Date(a.detected_at).toLocaleString('vi-VN') : '-'}</small>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div className="title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Danh sách hợp đồng</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Theo dõi ngày hết hạn, số ngày còn lại và trạng thái tạo cơ hội gia hạn.</p>
          </div>
        </div>

        <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <input
            placeholder="Tìm mã hợp đồng hoặc khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '220px' }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiệu lực</option>
            <option value="expired">Đã hết hạn</option>
            <option value="cancelled">Đã hủy</option>
            <option value="renewed">Đã gia hạn</option>
          </select>
          <label className="check" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyWarning} onChange={(e) => setOnlyWarning(e.target.checked)} />
            Chỉ có cảnh báo
          </label>
          <button onClick={load} style={{ padding: '8px 16px', borderRadius: '6px', border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
            Tìm kiếm
          </button>
        </div>

        {loading ? (
          <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Đang tải...</p>
        ) : (
          <div className="table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Hợp đồng</th>
                  <th style={{ padding: '12px' }}>Khách hàng</th>
                  <th style={{ padding: '12px' }}>Giá trị</th>
                  <th style={{ padding: '12px' }}>Ngày hết hạn</th>
                  <th style={{ padding: '12px' }}>Còn lại</th>
                  <th style={{ padding: '12px' }}>Trạng thái</th>
                  <th style={{ padding: '12px' }}>Cảnh báo</th>
                  <th style={{ padding: '12px' }}>Gia hạn</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <b>{c.contract_code}</b>
                      {c.description && <small style={{ display: 'block', color: '#94a3b8' }}>{c.description}</small>}
                    </td>
                    <td style={{ padding: '12px' }}>{c.customer_name}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{money(c.contract_value)}</td>
                    <td style={{ padding: '12px' }}>{date(c.end_date)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: c.days_remaining < 0 ? '#dc2626' : c.days_remaining <= 30 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                        {c.days_remaining < 0
                          ? `Quá hạn ${Math.abs(c.days_remaining)} ngày`
                          : c.days_remaining === 0
                          ? 'Hết hạn hôm nay'
                          : `Còn ${c.days_remaining} ngày`}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`pill ${c.status}`} style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: '#f1f5f9' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {c.alerts?.length ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          {c.alerts.some((a) => a.type === 'expired') ? 'Đã hết hạn' : 'Sắp hết hạn'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Không</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {c.renewal_opportunity ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                          Đã tạo cơ hội
                        </span>
                      ) : c.status === 'active' || c.status === 'expired' ? (
                        <button
                          disabled={renewing === c.id}
                          onClick={() => void renew(c)}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {renewing === c.id ? 'Đang tạo...' : 'Tạo cơ hội gia hạn'}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

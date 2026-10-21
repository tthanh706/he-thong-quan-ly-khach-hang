import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Customer, Opportunity } from '../types';

export function DataPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tab, setTab] = useState<'customers' | 'opportunities'>('customers');

  useEffect(() => {
    void Promise.all([
      api<{ data: Customer[] }>('/customers').then((r) => setCustomers(r.data)),
      api<{ data: Opportunity[] }>('/opportunities').then((r) => setOpportunities(r.data)),
    ]);
  }, []);

  return (
    <section>
      <div className="page-title">
        <div>
          <h2>Dữ liệu sở hữu</h2>
          <p>Kiểm tra danh sách khách hàng và cơ hội kinh doanh theo phạm vi dữ liệu phân quyền.</p>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === 'customers' ? 'selected' : ''}
          onClick={() => setTab('customers')}
        >
          👥 Khách hàng ({customers.length})
        </button>
        <button
          className={tab === 'opportunities' ? 'selected' : ''}
          onClick={() => setTab('opportunities')}
        >
          💼 Cơ hội ({opportunities.length})
        </button>
      </div>
      <div className="card table-wrap">
        {tab === 'customers' ? (
          <table>
            <thead>
              <tr>
                <th>Tên khách hàng</th>
                <th>Email</th>
                <th>Chủ sở hữu</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có khách hàng nào trong phạm vi dữ liệu của bạn.
                  </td>
                </tr>
              ) : (
                customers.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.email ?? '—'}</td>
                    <td>{item.owner?.name ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cơ hội kinh doanh</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Chủ sở hữu</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có cơ hội nào trong phạm vi dữ liệu của bạn.
                  </td>
                </tr>
              ) : (
                opportunities.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.title}</strong></td>
                    <td>{Number(item.amount).toLocaleString('vi-VN')} ₫</td>
                    <td>
                      <span className="status active">{item.status}</span>
                    </td>
                    <td>{item.owner?.name ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

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

  return <section>
    <div className="page-title"><div><h2>Dữ liệu sở hữu</h2><p>Kiểm tra chủ sở hữu hiện tại sau các lần bàn giao.</p></div></div>
    <div className="tabs"><button className={tab === 'customers' ? 'selected' : ''} onClick={() => setTab('customers')}>Khách hàng ({customers.length})</button><button className={tab === 'opportunities' ? 'selected' : ''} onClick={() => setTab('opportunities')}>Cơ hội ({opportunities.length})</button></div>
    <div className="card table-wrap">
      {tab === 'customers' ? <table><thead><tr><th>Tên</th><th>Email</th><th>Chủ sở hữu</th></tr></thead><tbody>{customers.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.email ?? '—'}</td><td>{item.owner?.name ?? '—'}</td></tr>)}</tbody></table> : <table><thead><tr><th>Cơ hội</th><th>Số tiền</th><th>Trạng thái</th><th>Chủ sở hữu</th></tr></thead><tbody>{opportunities.map((item) => <tr key={item.id}><td>{item.title}</td><td>{Number(item.amount).toLocaleString('vi-VN')} ₫</td><td>{item.status}</td><td>{item.owner?.name ?? '—'}</td></tr>)}</tbody></table>}
    </div>
  </section>;
}

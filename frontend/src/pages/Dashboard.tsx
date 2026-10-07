import { useAuth } from '../hooks/useAuth';
import { useCustomers } from '../hooks/useCustomers';
import { useCampaigns } from '../hooks/useCampaigns';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { Users, Megaphone, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: custData, isLoading: custLoading } = useCustomers({ per_page: 5 });
  const { data: campData, isLoading: campLoading } = useCampaigns({ status: 'active', per_page: 5 });

  const totalCustomers = custData?.data?.total ?? 0;
  const totalCampaigns = campData?.data?.total ?? 0;

  const stats = [
    { label: 'Tổng khách hàng',    value: totalCustomers, icon: Users,     color: 'stat--blue'   },
    { label: 'Chiến dịch đang chạy', value: totalCampaigns, icon: Megaphone, color: 'stat--purple' },
    { label: 'Khách hàng active',  value: custData?.data?.data?.filter((c: any) => c.status === 'active').length ?? 0, icon: TrendingUp, color: 'stat--green' },
    { label: 'Chờ xử lý',         value: custData?.data?.data?.filter((c: any) => c.status === 'lead').length ?? 0, icon: AlertCircle, color: 'stat--orange' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Xin chào, {user?.name} 👋</h1>
          <p className="page-sub">Đây là tổng quan hoạt động hôm nay</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-icon"><Icon size={22} /></div>
            <div className="stat-info">
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Recent Customers */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Khách hàng gần đây</h2>
            <Link to="/customers" className="card-link">Xem tất cả</Link>
          </div>
          {custLoading ? <Spinner /> : (
            <div className="list">
              {custData?.data?.data?.map((c: any) => (
                <Link key={c.id} to={`/customers/${c.id}`} className="list-item">
                  <div className="list-avatar">{c.name[0]}</div>
                  <div className="list-info">
                    <p className="list-name">{c.name}</p>
                    <p className="list-sub">{c.company ?? c.email ?? '—'}</p>
                  </div>
                  <Badge label={c.status} variant={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Campaigns */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Chiến dịch đang chạy</h2>
            <Link to="/campaigns" className="card-link">Xem tất cả</Link>
          </div>
          {campLoading ? <Spinner /> : (
            <div className="list">
              {campData?.data?.data?.map((c: any) => (
                <div key={c.id} className="list-item">
                  <div className="list-avatar camp-avatar">{c.name[0]}</div>
                  <div className="list-info">
                    <p className="list-name">{c.name}</p>
                    <p className="list-sub">{c.budget ? Number(c.budget).toLocaleString('vi') + ' đ' : 'Chưa có ngân sách'}</p>
                  </div>
                  <Badge label={c.status} variant={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useSession } from './auth/SessionContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EntityListPage } from './pages/EntityListPage';
import { EntityDetailPage } from './pages/EntityDetailPage';
import { AccessChecksPage } from './pages/AccessChecksPage';
import {
  activityConfig,
  customerConfig,
  opportunityConfig,
  quoteConfig,
  type EntityConfig,
} from './config/entities';
import type { OwnedRecord } from './types';

function listRoute<T extends OwnedRecord>(config: EntityConfig<T>) {
  return function ListRoute() {
    return <EntityListPage config={config} />;
  };
}

function detailRoute<T extends OwnedRecord>(config: EntityConfig<T>) {
  return function DetailRoute() {
    return <EntityDetailPage config={config} />;
  };
}

const CustomerList = listRoute(customerConfig);
const CustomerDetail = detailRoute(customerConfig);
const OpportunityList = listRoute(opportunityConfig);
const OpportunityDetail = detailRoute(opportunityConfig);
const ActivityList = listRoute(activityConfig);
const ActivityDetail = detailRoute(activityConfig);
const QuoteList = listRoute(quoteConfig);
const QuoteDetail = detailRoute(quoteConfig);

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={(
          <RequireAuth>
            <Layout />
          </RequireAuth>
        )}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/opportunities" element={<OpportunityList />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/activities" element={<ActivityList />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/quotes" element={<QuoteList />} />
        <Route path="/quotes/:id" element={<QuoteDetail />} />
        <Route path="/access-checks" element={<AccessChecksPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

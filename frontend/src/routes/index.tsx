import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';
import CustomerDetail from '../pages/CustomerDetail';
import Campaigns from '../pages/Campaigns';
import ErrorPage from '../pages/ErrorPage';
import ProfilePage from '../pages/ProfilePage';
import UserImportPage from '../pages/UserImportPage';
import AuditLogPage from '../pages/AuditLogPage';
import CustomFieldsPage from '../pages/CustomFieldsPage';
import { useAuth } from '../hooks/useAuth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function ErrorWithAppLayout() {
  const { token } = useAuth();
  const page = <ErrorPage />;

  // Khi còn phiên đăng nhập, lỗi vẫn dùng sidebar/header của ứng dụng.
  // 401 hoặc người chưa đăng nhập vẫn có trang lỗi rõ ràng riêng.
  return token ? <AppLayout>{page}</AppLayout> : page;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    errorElement: <ErrorWithAppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      { path: 'campaigns', element: <Campaigns /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'users/import', element: <UserImportPage /> },
      { path: 'audit-logs', element: <AuditLogPage /> },
      { path: 'custom-fields', element: <CustomFieldsPage /> },
      {
        path: '*',
        element: (
          <ErrorPage
            statusCode={404}
            title="Không tìm thấy trang"
            message="Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi."
            primaryAction={{ label: 'Về Dashboard', url: '/dashboard' }}
            secondaryAction={{ label: 'Quay lại trang trước', url: '__BACK__' }}
          />
        ),
      },
    ],
  },
  {
    path: '/error',
    element: <ErrorWithAppLayout />,
  },
  {
    path: '*',
    element: (
      <ErrorPage
        statusCode={404}
        title="Không tìm thấy trang"
        message="Đường dẫn bạn truy cập không tồn tại."
        primaryAction={{ label: 'Đăng nhập', url: '/login' }}
      />
    ),
  },
]);

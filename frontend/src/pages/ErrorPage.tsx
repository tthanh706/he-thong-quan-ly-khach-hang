import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useRouteError } from 'react-router-dom';
import { AlertCircle, Lock, CreditCard, Search, ServerCrash, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import type { ApiError } from '../types';
import './ErrorPage.css';

export interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  primaryAction?: { label: string; url: string };
  secondaryAction?: { label: string; url: string } | null;
  onNavigate?: (url: string) => void;
}

interface DefaultErrorConfig {
  statusCode: number;
  badgeLabel: string;
  title: string;
  message: string;
  primaryAction: { label: string; url: string };
  secondaryAction: { label: string; url: string } | null;
}

const defaultsByCode: Record<number, DefaultErrorConfig> = {
  401: {
    statusCode: 401,
    badgeLabel: '401 Unauthorized',
    title: 'Bạn cần đăng nhập',
    message: 'Phiên đăng nhập đã hết hạn hoặc bạn chưa có quyền truy cập. Vui lòng đăng nhập lại.',
    primaryAction: { label: 'Đăng nhập lại', url: '/login' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  402: {
    statusCode: 402,
    badgeLabel: '402 Payment Required',
    title: 'Yêu cầu thanh toán',
    message: 'Tài khoản hoặc tính năng này yêu cầu thanh toán hoặc nâng cấp gói dịch vụ để tiếp tục sử dụng.',
    primaryAction: { label: 'Về trang chủ', url: '/accounts' },
    secondaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
  },
  403: {
    statusCode: 403,
    badgeLabel: '403 Forbidden',
    title: 'Bạn không có quyền truy cập',
    message: 'Tài khoản của bạn không đủ quyền hạn để xem nội dung này. Vui lòng liên hệ quản trị viên.',
    primaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  404: {
    statusCode: 404,
    badgeLabel: '404 Not Found',
    title: 'Không tìm thấy trang',
    message: 'Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi, xóa khỏi hệ thống.',
    primaryAction: { label: 'Về trang chủ', url: '/accounts' },
    secondaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
  },
  419: {
    statusCode: 419,
    badgeLabel: '419 Session Expired',
    title: 'Phiên làm việc đã hết hạn',
    message: 'Trang đã hết hạn do không hoạt động trong thời gian dài. Vui lòng tải lại trang.',
    primaryAction: { label: 'Tải lại trang', url: '__RELOAD__' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  500: {
    statusCode: 500,
    badgeLabel: '500 Server Error',
    title: 'Đã có lỗi hệ thống xảy ra',
    message: 'Hệ thống gặp sự cố trong quá trình xử lý. Đội ngũ kỹ thuật đang kiểm tra và khắc phục.',
    primaryAction: { label: 'Thử lại ngay', url: '__RELOAD__' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
};

function readStoredApiError(): ApiError | null {
  const raw = sessionStorage.getItem('last_api_error');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ApiError;
  } catch {
    return null;
  }
}

export default function ErrorPage(props: ErrorPageProps) {
  let routeError: (Error & { apiError?: ApiError }) | null = null;
  let routerNavigate: ((to: any) => void) | null = null;
  let queryCode = 0;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routeError = useRouteError() as (Error & { apiError?: ApiError }) | null;
  } catch {}

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routerNavigate = useNavigate();
  } catch {}

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    queryCode = Number(new URLSearchParams(location.search).get('status'));
  } catch {
    queryCode = Number(new URLSearchParams(window.location.search).get('status'));
  }

  const storedError = useMemo(() => readStoredApiError(), []);
  const apiErr = routeError?.apiError ?? storedError;
  const rawCode = apiErr?.status_code ?? props.statusCode ?? (Number.isFinite(queryCode) && queryCode > 0 ? queryCode : 404);
  const code = defaultsByCode[rawCode] ? rawCode : (rawCode >= 500 ? 500 : 404);
  const defaults = defaultsByCode[code] ?? defaultsByCode[404];

  const title = apiErr?.title ?? props.title ?? defaults.title;
  const message = apiErr?.message ?? props.message ?? defaults.message;
  const primary = props.primaryAction ?? defaults.primaryAction;
  const secondary = props.secondaryAction ?? defaults.secondaryAction;

  useEffect(() => {
    return () => {
      sessionStorage.removeItem('last_api_error');
    };
  }, []);

  const runAction = (url?: string) => {
    if (!url) return;

    if (props.onNavigate) {
      props.onNavigate(url);
      return;
    }

    if (url === '__BACK__') {
      if (routerNavigate) {
        routerNavigate(-1);
      } else {
        window.history.back();
      }
      return;
    }

    if (url === '__RELOAD__') {
      window.location.reload();
      return;
    }

    if (routerNavigate) {
      routerNavigate(url);
    } else {
      window.location.href = url;
    }
  };

  const renderIcon = () => {
    switch (code) {
      case 401:
        return <Lock size={16} />;
      case 402:
        return <CreditCard size={16} />;
      case 403:
        return <Lock size={16} />;
      case 404:
        return <Search size={16} />;
      case 500:
        return <ServerCrash size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="error-page-container" role="alert" aria-live="polite">
      <div className="error-card">
        <div className={`error-badge badge-${code}`}>
          {renderIcon()}
          <span>{defaults.badgeLabel}</span>
        </div>
        <div className={`error-code code-${code}`}>{code}</div>
        <div className="error-divider" />
        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>
        <div className="error-actions">
          <button className="error-btn-primary" onClick={() => runAction(primary.url)}>
            {primary.url === '__RELOAD__' ? <RefreshCw size={16} /> : primary.url === '/accounts' || primary.url === '/dashboard' ? <Home size={16} /> : null}
            <span>{primary.label}</span>
          </button>
          {secondary && (
            <button className="error-btn-secondary" onClick={() => runAction(secondary.url)}>
              {secondary.url === '__BACK__' ? <ArrowLeft size={16} /> : null}
              <span>{secondary.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

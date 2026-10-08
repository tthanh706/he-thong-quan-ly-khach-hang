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
    title: '401 Unauthorized (Không được phép)',
    message: 'Yêu cầu cần có thông tin xác thực (đăng nhập) nhưng bạn chưa cung cấp hoặc thông tin đăng nhập không hợp lệ.',
    primaryAction: { label: 'Đăng nhập lại', url: '/login' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  402: {
    statusCode: 402,
    badgeLabel: '402 Payment Required',
    title: '402 Payment Required (Yêu cầu thanh toán)',
    message: 'Mã này được dành riêng cho tương lai, hiện tại dùng cho các hệ thống yêu cầu trả phí hoặc hoàn tất thanh toán mới được phép tiếp cận tài nguyên.',
    primaryAction: { label: 'Về trang chủ', url: '/accounts' },
    secondaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
  },
  403: {
    statusCode: 403,
    badgeLabel: '403 Forbidden',
    title: '403 Forbidden (Bị cấm)',
    message: 'Máy chủ đã hiểu yêu cầu nhưng từ chối thực thi nó (do bạn không có quyền hạn truy cập vào khu vực/tệp tin đó ngay cả khi đã đăng nhập).',
    primaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  404: {
    statusCode: 404,
    badgeLabel: '404 Not Found',
    title: '404 Not Found (Không tìm thấy)',
    message: 'Máy chủ không tìm thấy trang web hoặc đường dẫn (URL) mà bạn yêu cầu (có thể do nhập sai địa chỉ hoặc trang đã bị xóa).',
    primaryAction: { label: 'Về trang chủ', url: '/accounts' },
    secondaryAction: { label: 'Quay lại trang trước', url: '__BACK__' },
  },
  419: {
    statusCode: 419,
    badgeLabel: '419 Session Expired',
    title: '419 Session Expired (Phiên làm việc hết hạn)',
    message: 'Phiên làm việc đã hết hạn do không hoạt động trong thời gian dài. Vui lòng tải lại trang hoặc đăng nhập lại.',
    primaryAction: { label: 'Tải lại trang', url: '__RELOAD__' },
    secondaryAction: { label: 'Về trang chủ', url: '/accounts' },
  },
  500: {
    statusCode: 500,
    badgeLabel: '500 Internal Server Error',
    title: '500 Internal Server Error (Lỗi máy chủ nội bộ)',
    message: 'Lỗi chung phía máy chủ cho biết server gặp sự cố bất ngờ khiến nó không thể hoàn tất yêu cầu.',
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

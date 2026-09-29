import { useMemo, useState } from 'react';
import { runIsolationChecks } from '../checks/isolation';
import { useRequestContext, useSession } from '../auth/SessionContext';
import { ENTITY_CONFIGS } from '../config/entities';
import { repository } from '../services/repository';
import { isAccessDenied } from '../auth/errors';
import { SCOPE_LABEL } from '../types';

export function AccessChecksPage() {
  const ctx = useRequestContext();
  const { user } = useSession();
  const [probe, setProbe] = useState({ entity: 'customer' as (typeof ENTITY_CONFIGS)[number]['entity'], id: 'C3' });

  const results = useMemo(() => runIsolationChecks(), []);
  const passed = results.filter((item) => item.passed).length;

  const probeResult = useMemo(() => {
    try {
      const record = repository.get(probe.entity, probe.id, ctx);
      return { allowed: true, message: `Truy cập được bản ghi ${record.id}.` };
    } catch (error) {
      if (isAccessDenied(error)) {
        return { allowed: false, message: error.message };
      }
      return { allowed: false, message: error instanceof Error ? error.message : 'Lỗi không xác định.' };
    }
  }, [probe, ctx]);

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Kiểm thử tự động phân quyền</h1>
          <p className="page__summary">
            Cùng một bộ kiểm thử được chạy bằng Vitest (<code>npm test</code>) và hiển thị ngay tại đây.
          </p>
        </div>
        <div className="page__actions">
          <span className={`result-chip ${passed === results.length ? 'result-chip--ok' : 'result-chip--fail'}`}>
            {passed}/{results.length} kiểm thử đạt
          </span>
        </div>
      </header>

      <div className="panel">
        <div className="panel__head">
          <strong>Kết quả kiểm thử cách ly dữ liệu</strong>
        </div>
        <ul className="check-list">
          {results.map((result) => (
            <li key={result.id} className={result.passed ? 'check check--ok' : 'check check--fail'}>
              <span className="check__mark">{result.passed ? '✔' : '✖'}</span>
              <div>
                <strong>{result.title}</strong>
                <small>Yêu cầu: {result.requirement}</small>
                <small className="check__detail">{result.detail}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="panel__head">
          <strong>Thử truy cập trực tiếp với tài khoản đang đăng nhập</strong>
        </div>
        <p className="page__summary">
          Đang mô phỏng: <strong>{user?.name}</strong> · phạm vi{' '}
          <strong>{SCOPE_LABEL[repository.scopeOf(ctx)]}</strong>. Nhập mã bản ghi bất kỳ để xem hệ thống xử lý.
        </p>

        <div className="toolbar">
          <label className="toolbar__filter">
            <span>Phân hệ</span>
            <select
              value={probe.entity}
              onChange={(event) => setProbe({ ...probe, entity: event.target.value as typeof probe.entity })}
            >
              {ENTITY_CONFIGS.map((config) => (
                <option key={config.entity} value={config.entity}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar__filter">
            <span>Mã bản ghi</span>
            <input
              type="text"
              value={probe.id}
              onChange={(event) => setProbe({ ...probe, id: event.target.value })}
            />
          </label>
        </div>

        <p className={probeResult.allowed ? 'notice notice--success' : 'notice notice--error'} role="status">
          {probeResult.message}
        </p>

        <p className="footnote">
          Gợi ý thử nhanh: mã <code>KH-001</code> (của chính bạn), <code>KH-003</code> (của đồng nghiệp cùng nhóm),
          <code> KH-005</code> (c của nhóm khác). Mã khách hàng bắt đầu bằng <code>C</code>, cơ hội <code>O</code>,
          hoạt động <code>A</code>, báo giá <code>Q</code>.
        </p>
      </div>
    </section>
  );
}

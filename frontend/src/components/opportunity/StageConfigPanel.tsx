import { useEffect, useState } from 'react';
import type { StageConfig } from '../../types/opportunity';

interface Props {
  configs: StageConfig[];
  onSave: (id: number, days: number, active: boolean) => Promise<void>;
}

const labels: Record<string, string> = {
  new: 'Mới',
  consulting: 'Đang tư vấn',
  negotiation: 'Đàm phán',
  contract: 'Chờ hợp đồng',
};

export default function StageConfigPanel({ configs, onSave }: Props) {
  const [drafts, setDrafts] = useState<Record<number, { days: number; active: boolean }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const next: Record<number, { days: number; active: boolean }> = {};
    configs.forEach((c) => { next[c.id] = { days: c.inactivity_days, active: c.is_active }; });
    setDrafts(next);
  }, [configs]);

  return (
    <section className="panel">
      <div className="section-title"><div><h2>Cấu hình ngưỡng đình trệ</h2><p>Số ngày không có hoạt động trước khi hệ thống cảnh báo.</p></div></div>
      <div className="config-grid">
        {configs.map((config) => {
          const draft = drafts[config.id] ?? { days: config.inactivity_days, active: config.is_active };
          return (
            <div className="config-card" key={config.id}>
              <strong>{labels[config.stage] ?? config.stage}</strong>
              <label>Số ngày không hoạt động</label>
              <input
                type="number"
                min={1}
                max={365}
                value={draft.days}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [config.id]: { ...draft, days: Number(e.target.value) } }))}
              />
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [config.id]: { ...draft, active: e.target.checked } }))}
                />
                Bật cảnh báo
              </label>
              <button
                className="secondary-button"
                disabled={savingId === config.id}
                onClick={async () => {
                  setSavingId(config.id);
                  try { await onSave(config.id, draft.days, draft.active); }
                  finally { setSavingId(null); }
                }}
              >
                {savingId === config.id ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

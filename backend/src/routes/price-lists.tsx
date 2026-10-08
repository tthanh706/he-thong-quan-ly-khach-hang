import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { Badge, Button, Field, Modal, inputClass } from "@/components/ui";
import { createPriceList, listPriceLists, updatePriceList } from "@/lib/catalog/server";

export const Route = createFileRoute("/price-lists")({ component: PriceListsPage });

type Draft = {
  id?: number;
  code: string;
  name: string;
  isStandard: boolean;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  note: string;
};

const empty: Draft = {
  code: "",
  name: "",
  isStandard: false,
  isActive: true,
  effectiveFrom: "2026-01-01",
  effectiveTo: "",
  note: "",
};

function PriceListsPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["price-lists"], queryFn: () => listPriceLists() });
  const items = q.data?.data ?? [];

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const payload = {
        code: draft.code,
        name: draft.name,
        currency: "VND",
        isStandard: draft.isStandard,
        isActive: draft.isActive,
        effectiveFrom: draft.effectiveFrom || null,
        effectiveTo: draft.effectiveTo || null,
        note: draft.note || null,
      };
      if (draft.id) return updatePriceList({ data: { ...payload, id: draft.id } });
      return createPriceList({ data: payload });
    },
    onSuccess: async () => {
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["price-lists"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <AppShell>
      <PageHead
        title="Bảng giá niêm yết"
        hint="Chỉ một bảng được đánh dấu chuẩn. Khi bật is_standard, các bảng khác tự hạ cờ."
        action={<Button onClick={() => { setDraft({ ...empty }); setError(null); }}>Thêm bảng giá</Button>}
      />
      <div className="grid gap-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
            {q.isLoading ? "Đang tải…" : "Chưa có bảng giá."}
          </div>
        )}
        {items.map((pl) => (
          <article key={pl.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl text-primary">{pl.name}</h2>
                  {pl.isStandard && <Badge tone="accent">Niêm yết chuẩn</Badge>}
                  <Badge tone={pl.isActive ? "ok" : "muted"}>{pl.isActive ? "Hiệu lực" : "Ngưng"}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">{pl.code}</p>
                <p className="mt-2 text-sm text-muted">
                  {pl.effectiveFrom ?? "—"} → {pl.effectiveTo ?? "không hạn"} · {pl.itemCount} dòng giá
                </p>
                {pl.note && <p className="mt-1 text-sm">{pl.note}</p>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="line"
                  onClick={() => {
                    setDraft({
                      id: pl.id,
                      code: pl.code,
                      name: pl.name,
                      isStandard: pl.isStandard,
                      isActive: pl.isActive,
                      effectiveFrom: pl.effectiveFrom ?? "",
                      effectiveTo: pl.effectiveTo ?? "",
                      note: pl.note ?? "",
                    });
                    setError(null);
                  }}
                >
                  Sửa
                </Button>
                <Link to="/price-lists/$id" params={{ id: String(pl.id) }}>
                  <Button>Chi tiết dòng giá</Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {draft && (
        <Modal title={draft.id ? "Sửa bảng giá" : "Thêm bảng giá"} onClose={() => setDraft(null)}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="Mã">
              <input className={inputClass} required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            </Field>
            <Field label="Tên">
              <input className={inputClass} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hiệu lực từ">
                <input className={inputClass} type="date" value={draft.effectiveFrom} onChange={(e) => setDraft({ ...draft, effectiveFrom: e.target.value })} />
              </Field>
              <Field label="Hiệu lực đến">
                <input className={inputClass} type="date" value={draft.effectiveTo} onChange={(e) => setDraft({ ...draft, effectiveTo: e.target.value })} />
              </Field>
            </div>
            <Field label="Ghi chú">
              <textarea className={inputClass + " py-2"} rows={3} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isStandard} onChange={(e) => setDraft({ ...draft, isStandard: e.target.checked })} />
              Đặt làm bảng giá niêm yết chuẩn
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
              Đang hiệu lực
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Lưu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { Badge, Button, Field, Modal, inputClass } from "@/components/ui";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "@/lib/catalog/server";
import type { Product, ProductType } from "@/lib/catalog/types";
import { formatVnd } from "@/lib/cn";

export const Route = createFileRoute("/products")({ component: ProductsPage });

type Draft = {
  id?: number;
  sku: string;
  name: string;
  type: ProductType;
  unit: string;
  description: string;
  listPrice: number;
  isActive: boolean;
};

const empty: Draft = {
  sku: "",
  name: "",
  type: "SERVICE",
  unit: "license",
  description: "",
  listPrice: 0,
  isActive: true,
};

function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"ALL" | ProductType>("ALL");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["products", page, q, type],
    queryFn: () => listProducts({ data: { page, perPage: 8, q, type } }),
  });
  const meta = list.data?.data.meta;
  const items = list.data?.data.items ?? [];

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const payload = {
        sku: draft.sku,
        name: draft.name,
        type: draft.type,
        unit: draft.unit,
        description: draft.description || null,
        listPrice: Number(draft.listPrice),
        currency: "VND",
        isActive: draft.isActive,
      };
      if (draft.id) return updateProduct({ data: { ...payload, id: draft.id } });
      return createProduct({ data: payload });
    },
    onSuccess: async () => {
      setDraft(null);
      setError(null);
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProduct({ data: { id } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const title = useMemo(() => (draft?.id ? "Sửa sản phẩm / dịch vụ" : "Thêm sản phẩm / dịch vụ"), [draft]);

  return (
    <AppShell>
      <PageHead
        title="Sản phẩm / Dịch vụ"
        hint="Giám đốc kinh doanh quản lý catalog. SKU duy nhất, giá niêm yết VND, soft delete."
        action={<Button onClick={() => { setDraft({ ...empty }); setError(null); }}>Thêm mới</Button>}
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Tìm SKU hoặc tên…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={inputClass + " sm:max-w-48"}
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setPage(1);
          }}
        >
          <option value="ALL">Tất cả loại</option>
          <option value="PRODUCT">Sản phẩm</option>
          <option value="SERVICE">Dịch vụ</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-primary/5 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Đơn vị</th>
                <th className="px-4 py-3">Giá niêm yết</th>
                <th className="px-4 py-3">TT</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    {list.isLoading ? "Đang tải…" : "Chưa có bản ghi."}
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <Row
                  key={p.id}
                  p={p}
                  onEdit={() => {
                    setDraft({
                      id: p.id,
                      sku: p.sku,
                      name: p.name,
                      type: p.type,
                      unit: p.unit,
                      description: p.description ?? "",
                      listPrice: p.listPrice,
                      isActive: p.isActive,
                    });
                    setError(null);
                  }}
                  onDelete={() => remove.mutate(p.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {meta && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
            <span>
              Trang {meta.page}/{meta.lastPage} · {meta.total} bản ghi
            </span>
            <div className="flex gap-2">
              <Button variant="line" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </Button>
              <Button
                variant="line"
                disabled={page >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {draft && (
        <Modal title={title} onClose={() => setDraft(null)}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="SKU">
              <input className={inputClass} value={draft.sku} required onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
            </Field>
            <Field label="Tên">
              <input className={inputClass} value={draft.name} required onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Loại">
                <select className={inputClass} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ProductType })}>
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="SERVICE">Dịch vụ</option>
                </select>
              </Field>
              <Field label="Đơn vị">
                <input className={inputClass} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
              </Field>
            </div>
            <Field label="Giá niêm yết (VND)">
              <input
                className={inputClass}
                type="number"
                min={0}
                value={draft.listPrice}
                onChange={(e) => setDraft({ ...draft, listPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                className={inputClass + " py-2"}
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              Đang kinh doanh
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
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

function Row({
  p,
  onEdit,
  onDelete,
}: {
  p: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
      <td className="px-4 py-3">{p.name}</td>
      <td className="px-4 py-3">
        <Badge tone={p.type === "SERVICE" ? "accent" : "ink"}>
          {p.type === "SERVICE" ? "Dịch vụ" : "Sản phẩm"}
        </Badge>
      </td>
      <td className="px-4 py-3">{p.unit}</td>
      <td className="px-4 py-3">{formatVnd(p.listPrice)}</td>
      <td className="px-4 py-3">
        <Badge tone={p.isActive ? "ok" : "muted"}>{p.isActive ? "Active" : "Ẩn"}</Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" onClick={onEdit}>
          Sửa
        </Button>
        <Button variant="ghost" onClick={onDelete}>
          Xóa
        </Button>
      </td>
    </tr>
  );
}

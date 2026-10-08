import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { Badge, Button, Field, Modal, inputClass } from "@/components/ui";
import {
  deletePriceListItem,
  getPriceListDetail,
  listProducts,
  upsertPriceListItem,
} from "@/lib/catalog/server";
import { formatVnd } from "@/lib/cn";

export const Route = createFileRoute("/price-lists/$id")({ component: DetailPage });

function DetailPage() {
  const { id } = Route.useParams();
  const listId = Number(id);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<number | "">("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [minQty, setMinQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["price-list", listId],
    queryFn: () => getPriceListDetail({ data: { id: listId } }),
  });
  const products = useQuery({
    queryKey: ["products-all"],
    queryFn: () => listProducts({ data: { page: 1, perPage: 50, type: "ALL" } }),
  });

  const save = useMutation({
    mutationFn: () =>
      upsertPriceListItem({
        data: {
          priceListId: listId,
          productId: Number(productId),
          unitPrice,
          minQty,
        },
      }),
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["price-list", listId] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (itemId: number) => deletePriceListItem({ data: { id: itemId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-list", listId] }),
  });

  const pack = detail.data?.data;
  const list = pack?.list;
  const items = pack?.items ?? [];

  return (
    <AppShell>
      <PageHead
        title={list?.name ?? "Chi tiết bảng giá"}
        hint={list ? `${list.code} · ${list.currency}` : "Đang tải…"}
        action={
          <div className="flex gap-2">
            <Link to="/price-lists">
              <Button variant="line">Quay lại</Button>
            </Link>
            <Button
              onClick={() => {
                setOpen(true);
                setError(null);
                const first = products.data?.data.items[0];
                setProductId(first?.id ?? "");
                setUnitPrice(first?.listPrice ?? 0);
                setMinQty(1);
              }}
            >
              Thêm dòng giá
            </Button>
          </div>
        }
      />
      {list && (
        <div className="mb-4 flex flex-wrap gap-2">
          {list.isStandard && <Badge tone="accent">Niêm yết chuẩn</Badge>}
          <Badge tone={list.isActive ? "ok" : "muted"}>{list.isActive ? "Hiệu lực" : "Ngưng"}</Badge>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-primary/5 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">SL tối thiểu</th>
                <th className="px-4 py-3">Đơn giá</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Chưa có dòng giá.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-t border-line">
                  <td className="px-4 py-3 font-mono text-xs">{it.productSku}</td>
                  <td className="px-4 py-3">{it.productName}</td>
                  <td className="px-4 py-3">
                    <Badge>{it.productType === "SERVICE" ? "Dịch vụ" : "Sản phẩm"}</Badge>
                  </td>
                  <td className="px-4 py-3">{it.minQty}</td>
                  <td className="px-4 py-3">{formatVnd(it.unitPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => remove.mutate(it.id)}>
                      Gỡ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {open && (
        <Modal title="Thêm / cập nhật dòng giá" onClose={() => setOpen(false)}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="Sản phẩm">
              <select
                className={inputClass}
                value={productId}
                onChange={(e) => {
                  const idn = Number(e.target.value);
                  setProductId(idn);
                  const p = products.data?.data.items.find((x) => x.id === idn);
                  if (p) setUnitPrice(p.listPrice);
                }}
              >
                <option value="">Chọn…</option>
                {products.data?.data.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Đơn giá (VND)">
              <input className={inputClass} type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
            </Field>
            <Field label="Số lượng tối thiểu">
              <input className={inputClass} type="number" min={0.01} step="0.01" value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!productId || save.isPending}>
                Lưu
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

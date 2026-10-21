import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHead } from "@/components/app-shell";
import { Badge, Button, Field, Modal, inputClass } from "@/components/ui";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/catalog/server";
import type { CategoryType, CommonCategory } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

const TYPES: { id: CategoryType | "ALL"; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "LEAD_SOURCE", label: "Nguồn lead" },
  { id: "INDUSTRY", label: "Ngành nghề" },
  { id: "BUSINESS_TYPE", label: "Loại hình" },
];

const TYPE_LABEL: Record<CategoryType, string> = {
  LEAD_SOURCE: "Nguồn lead",
  INDUSTRY: "Ngành nghề",
  BUSINESS_TYPE: "Loại hình",
};

type Draft = {
  id?: number;
  categoryType: CategoryType;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

const empty: Draft = {
  categoryType: "LEAD_SOURCE",
  code: "",
  name: "",
  description: "",
  sortOrder: 10,
  isActive: true,
};

function CategoriesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<CategoryType | "ALL">("ALL");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["categories", tab],
    queryFn: () => listCategories({ data: { categoryType: tab } }),
  });
  const items = q.data?.data ?? [];

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const payload = {
        categoryType: draft.categoryType,
        code: draft.code,
        name: draft.name,
        description: draft.description || null,
        sortOrder: Number(draft.sortOrder),
        isActive: draft.isActive,
      };
      if (draft.id) return updateCategory({ data: { ...payload, id: draft.id } });
      return createCategory({ data: payload });
    },
    onSuccess: async () => {
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["categories"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteCategory({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <AppShell>
      <PageHead
        title="Danh mục dùng chung"
        hint="S2-07: Nguồn lead, Ngành nghề, Loại hình doanh nghiệp. Code unique theo loại."
        action={
          <Button
            onClick={() => {
              setDraft({ ...empty, categoryType: tab === "ALL" ? "LEAD_SOURCE" : tab });
              setError(null);
            }}
          >
            Thêm danh mục
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm",
              tab === t.id ? "bg-primary text-primary-fg" : "border border-line bg-surface",
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-primary/5 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Thứ tự</th>
                <th className="px-4 py-3">TT</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    {q.isLoading ? "Đang tải…" : "Chưa có danh mục."}
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Badge>{TYPE_LABEL[c.categoryType]}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3">
                    <div>{c.name}</div>
                    {c.description && <div className="text-xs text-muted">{c.description}</div>}
                  </td>
                  <td className="px-4 py-3">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.isActive ? "ok" : "muted"}>{c.isActive ? "Active" : "Ẩn"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDraft({
                          id: c.id,
                          categoryType: c.categoryType,
                          code: c.code,
                          name: c.name,
                          description: c.description ?? "",
                          sortOrder: c.sortOrder,
                          isActive: c.isActive,
                        });
                        setError(null);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button variant="ghost" onClick={() => remove.mutate(c.id)}>
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {draft && (
        <Modal title={draft.id ? "Sửa danh mục" : "Thêm danh mục"} onClose={() => setDraft(null)}>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="Loại">
              <select
                className={inputClass}
                value={draft.categoryType}
                onChange={(e) => setDraft({ ...draft, categoryType: e.target.value as CategoryType })}
              >
                <option value="LEAD_SOURCE">Nguồn lead</option>
                <option value="INDUSTRY">Ngành nghề</option>
                <option value="BUSINESS_TYPE">Loại hình</option>
              </select>
            </Field>
            <Field label="Mã">
              <input className={inputClass} required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            </Field>
            <Field label="Tên">
              <input className={inputClass} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Mô tả">
              <textarea className={inputClass + " py-2"} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label="Thứ tự">
              <input className={inputClass} type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
              Đang sử dụng
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

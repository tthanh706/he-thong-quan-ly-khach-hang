import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, FolderTree, LayoutDashboard, Tags } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/products", label: "Sản phẩm / Dịch vụ", icon: Boxes },
  { to: "/price-lists", label: "Bảng giá niêm yết", icon: Tags },
  { to: "/categories", label: "Danh mục dùng chung", icon: FolderTree },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="grain min-h-dvh">
      <header className="border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl tracking-tight text-primary">Nautilus CRM</span>
            <span className="hidden text-xs uppercase tracking-[0.18em] text-muted sm:inline">
              Nhóm 2 · S2-05 / S2-07
            </span>
          </div>
          <div className="text-right text-xs text-muted">
            <div className="font-medium text-ink">Giám đốc kinh doanh</div>
            <div>Sprint 2 · Catalog</div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition",
                  active
                    ? "bg-primary text-primary-fg"
                    : "text-muted hover:bg-primary/8 hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PageHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-primary">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{hint}</p>
      </div>
      {action}
    </div>
  );
}

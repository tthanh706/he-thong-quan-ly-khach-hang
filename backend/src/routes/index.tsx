import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes, FolderTree, Tags } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { getCatalogStats } from "@/lib/catalog/server";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const q = useQuery({ queryKey: ["stats"], queryFn: () => getCatalogStats() });
  const s = q.data?.data;

  return (
    <AppShell>
      <PageHead
        title="Catalog kinh doanh"
        hint="S2-05 Quản lý sản phẩm / dịch vụ & bảng giá niêm yết. S2-07 Khai báo danh mục dùng chung: nguồn lead, ngành nghề, loại hình."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sản phẩm" value={s?.productCount} />
        <Stat label="Dịch vụ" value={s?.serviceCount} />
        <Stat label="Bảng giá" value={s?.priceListCount} />
        <Stat label="Danh mục dùng chung" value={s?.categoryCount} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card
          to="/products"
          icon={Boxes}
          title="Sản phẩm / Dịch vụ"
          body="SKU, đơn vị, giá niêm yết, trạng thái. Soft delete, không trùng SKU."
          api="GET /api/v1/products"
        />
        <Card
          to="/price-lists"
          icon={Tags}
          title="Bảng giá niêm yết"
          body="Một bảng chuẩn toàn hệ thống. Có thể tạo bảng Enterprise với giá điều chỉnh."
          api="GET /api/v1/price-lists"
        />
        <Card
          to="/categories"
          icon={FolderTree}
          title="Danh mục dùng chung"
          body="LeadSource, Industry, BusinessType — dùng cho Lead, Customer, Opportunity."
          api="GET /api/v1/common-categories"
        />
      </div>
      <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-display text-xl text-primary">Backend Laravel 13 · PHP 8.3</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Mã nguồn PHP nằm trong thư mục <code className="text-ink">laravel/</code> theo Clean API:
          Controller mỏng, FormRequest, Service, JsonResource, Policy, Enum, Migration snake_case.
          Ứng dụng preview này chạy cùng contract JSON:{" "}
          <code className="text-ink">{`{ success, data, message }`}</code>.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>ProductController / ProductService / CreateProductRequest</li>
          <li>PriceListController + PriceListItem (bảng giá chuẩn is_standard)</li>
          <li>CommonCategoryController — category_type LEAD_SOURCE | INDUSTRY | BUSINESS_TYPE</li>
        </ul>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-display text-4xl text-primary">{value ?? "—"}</div>
    </div>
  );
}

function Card({
  to,
  icon: Icon,
  title,
  body,
  api,
}: {
  to: string;
  icon: typeof Boxes;
  title: string;
  body: string;
  api: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-primary/40"
    >
      <Icon className="size-5 text-accent" />
      <h3 className="mt-3 font-display text-xl text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <p className="mt-3 font-mono text-xs text-accent">{api}</p>
    </Link>
  );
}
